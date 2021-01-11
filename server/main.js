/* -------------------------------------------------------------------------- */
//                     ######## LOAD LIBRARIES ########
/* -------------------------------------------------------------------------- */
//#region 

const express = require('express')
const expressWS = require('express-ws')
const secure = require('secure-env')
const morgan = require('morgan')
const cors = require('cors')

const jwt = require('jsonwebtoken')
const auth0_jwt = require('express-jwt');
const auth0_jwksRsa = require('jwks-rsa');

// Passport core
const passport = require('passport')
// Passport Strategies
const { localStrategy, mkAuth } = require('./passport_strategy.js')
const sha256 = require('sha256')

const { MongoClient} = require('mongodb')
const AWS = require('aws-sdk')
const multer = require('multer')
const fs = require('fs')

const { 
    MONGO_DB, MONGO_COLLECTION, MONGO_COLLECTION2, mongo, 
    AWS_ENDPOINT, s3, ENV_PASSWORD, ENV_PORT
} = require('./server_config.js')

const { myReadFile, uploadToS3, unlinkAllFiles, insertCredentialsMongo, checkExistsMongo } = require('./db_utils.js')
const { } = require('./helper.js')

const ROOMS = { }

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
//             ######## DECLARE VARIABLES & CONFIGURATIONS ########
/* -------------------------------------------------------------------------- */
//#region

// Configure passport with a strategy
passport.use(localStrategy)

const localStrategyAuth = mkAuth(passport, 'local')

// Check the token for Auth0
const checkJwt = auth0_jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: auth0_jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://binrong.us.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://binrong.us.auth0.com/`,
    algorithms: ['RS256']
});

// Sign a jwt token
const signToken = (payload) => {
    const currTime = (new Date()).getTime() / 1000
    return  jwt.sign({
        sub: payload.username,
        iss: 'myapp',
        iat: currTime,
        // exp: currTime + (30),
        data: {
            // avatar: req.user.avatar,
            loginTime : payload.loginTime
        }
    }, ENV_PASSWORD)
}
  
// Declare the port to run server on
const PORT = parseInt(process.argv[2]) || parseInt(ENV_PORT) || 3000
// Create an instance of express
const app = express()
// Create an instance for express ws
const appWS = expressWS(app)
// Create an instance of multer
// const upload = multer()
const upload = multer({dest: `${__dirname}/uploads/`})

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */




/* -------------------------------------------------------------------------- */
//                          ######## REQUESTS ########
/* -------------------------------------------------------------------------- */
//#region 

// Log incoming requests using morgan
app.use(morgan('tiny'))
// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({extended:false}))
// Parse application/json
app.use(express.json())
// initialise passport (must be done after parsing  json / urlencoded)
app.use(passport.initialize())
// Apply cors headers to resp
app.use(cors())

// POST /api/login
app.post('/api/login',
// passport middleware to perform authentication
localStrategyAuth,
(req, resp) => {
    const token = signToken(req.user)
    resp.status(200)
    resp.type('application/json')
    resp.json({message: `Login at ${new Date()}`, token, user: req.user})
})

app.post('/api/auth0-login',
// auth0 middleware
checkJwt,
(req, resp) => {
    console.info("body is",req.body)
    const token = signToken(req.body)
    resp.status(200)
    resp.type("application/json")
    resp.json({message: `Login at ${new Date()}`, token, user: req.body})
})

app.post('/api/register', async (req, resp) => {
    const credentials = req.body
    // check if client has posted the credentials correctly
    if (!credentials.password || !credentials.username || !credentials.email) {
        resp.status(401)
        resp.type('application/json')
        resp.json({message:"Missing credentials."})
        return
    }
    credentials.password = sha256(credentials.password)

    // check if username already exists    
    const exists = await checkExistsMongo(credentials)
    if (!exists.length <= 0) {
        resp.status(409)
        resp.type('application/json')
        resp.json({message:"Username already exists."})
        return
    } else {
        try {
            // Insert credentials into mongo database if not exists
            const insertedId = await insertCredentialsMongo(credentials)
            console.info("Mongodb inserted ID: ",insertedId)
        } catch (e) {
            console.info(e)
        }
        resp.status(200)
        resp.type('application/json')
        resp.json({message:"Successfully created an account!"})
        return
    }
})

// POST /api/upload
app.post('/api/upload', upload.single('file'), async (req, resp) => {
    // Parse the json string sent from client into json object
    const data = JSON.parse(req.body.data)
    console.info(req.file)
    console.info(data)
    try {
        // const buffer = await myReadFile(req.file.path)
        // const key = await uploadToS3(buffer, req)
        resp.status(200)
        resp.type('application/json')
        // resp.json({key:key})
        resp.json({key:"test"})
    } catch (e) {
        console.info("Error in /upload : ", e)
        resp.status(404)
        resp.type('application/json')
        resp.json({})
    }
})

app.get('/api/check', (req, resp, next) => {
    const auth = req.get('Authorization')
    if (null == auth) {
        resp.status(403)
        resp.type('application/json')
        resp.json({message:"Missing Authorization Header."})
        return
    }
    const terms = auth.split(' ')
    if ((terms.length != 2) || (terms[0] != 'Bearer')) {
        resp.status(403)
        resp.json({message: 'Incorrect Authorization'})
        return
    }
    const token = terms[1]
    jwt.verify(token, ENV_PASSWORD, (err, decoded) => {
        if (err) {
            resp.status(403)
            resp.type('application/json')
            resp.json({message: "Incorrect Token: " + err})
        } else {
            // req.token = decoded
            next()
        }
    })
}, (req, resp) => {
    resp.status(200)
    resp.type('application/json')
    resp.json({message: 'Authentication successful'})
})

const broadcastMsg = (code, chat) => {
    for (let i in ROOMS[code]) {
        console.info("sending message")
        ROOMS[code][i].send(chat)
    }
}

// Websocket room
app.ws('/room', (ws, req) => {
    // need to check if room already exist
    const payload = JSON.parse(req.query.payload)
    const name = payload.name == "server" ? "fake_server" : payload.name
    const code = payload.code
    console.info("payload",payload)
    ROOMS[code] = ROOMS[code] ? ROOMS[code] : {}
    ROOMS[code][name] = ws
    ws.name = payload.name
    const chat = JSON.stringify({
        from: 'Server',
        message: `${name} has joined the room.`,
        ts: (new Date().toTimeString().split(' ')[0])
    })
    // broadcast to everyone in the room
    broadcastMsg(code, chat)
        
    ws.on('message', (data) => {
        console.info('Message incoming:',data)
        const chat = JSON.stringify({
            from: name,
            message: data,
            ts: (new Date().toTimeString().split(' ')[0])
        })
        console.info(chat)
        // broadcast to everyone in the room
        broadcastMsg(code, chat)
    })

    ws.on('close', () => {
        console.info(`Closing websocket connection for ${name}`)
        // close our end of connection
        ROOMS[code][name].close()
        // remove ourself from the room
        delete ROOMS[code][name]

        const chat = JSON.stringify({
            from: 'Server',
            message: `${name} has left the room.`,
            ts: (new Date().toTimeString().split(' ')[0])
        })
        broadcastMsg(code, chat)
    })
})

// Resource not found
app.use('*', (req, resp) => {
    resp.status(404)
    resp.type('application/json')
    resp.json({message:"Resource not found."})
})

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
//                    ######## INITIALISING SERVER ########
/* -------------------------------------------------------------------------- */
//#region 

// Tests the mongo server
const checkMongo = () => {
    try {
        console.info("Pinging Mongo in progress...")
        return mongo.connect()
        .then (() => {
            console.info("Pinging Mongo is successful...")
            return Promise.resolve()
        })
    } catch (e) {
        return Promise.reject(e)
    }
}

// Tests the AWS server
const checkAWS = () => new Promise((resolve, reject) => {
    if (!!global.env.DIGITALOCEAN_ACCESS_KEY && !!global.env.DIGITALOCEAN_SECRET_ACCESS_KEY) {
        console.info("AWS keys found...")
        resolve()
    }
    else
        reject('S3 Key is not found.')
})

// Runs all tests before starting server
Promise.all([checkMongo(), checkAWS()])
.then (() => {
    app.listen(PORT, () => {
        console.info(`Application is listening PORT ${PORT} at ${new Date()}`)
    })
}).catch (e => {
    console.info("Error starting server: ",  e)
})

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */