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

const AWS = require('aws-sdk')
const multer = require('multer')
const fs = require('fs')

const { 
    mongo, AWS_ENDPOINT, s3, ENV_PASSWORD, ENV_PORT
} = require('./server_config.js')

const { myReadFile, uploadToS3, unlinkAllFiles, insertCredentialsMongo, checkExistsMongo, upsertNameMongo, upsertAvatarMongo, updatePasswordMongo } = require('./db_utils.js')
const { } = require('./helper.js')

const { sendEmail } = require('./nodemailer.js')

const ROOMS = { }
const HOSTS = { }
const USER_LOGGED_IN = []
const USER_TO_SPLICE = {}
const TIMER_TO_SPLICE = {}
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
    }, ENV_PASSWORD)
}
  
const signResetToken = (payload) => {
    const currTime = (new Date()).getTime() / 1000
    return  jwt.sign({
        sub: payload.username,
        email: payload.email,
        iss: 'myapp',
        iat: currTime,
        exp: currTime + (360),
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

// disable cache
app.disable('etag');
// Log incoming requests using morgan
app.use(morgan('tiny'))
// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({extended: false}))
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
    if(CHECK_AND_ADD_USER(req.user.name)) {
        resp.status(406)
        resp.type('application/json')
        resp.json({message:"Already logged in."})
        return
    }
    resp.status(200)
    resp.type('application/json')
    resp.json({message: `Login at ${new Date()}`, token, user: req.user})
})

// POST /api/auth0-login
app.post('/api/auth0-login',
// auth0 middleware
checkJwt,
(req, resp) => {
    console.info("body is",req.body)
    let credentials = req.body
    // check if user exists in g_user collection
    console.info("credentials username is",credentials.username)
    checkExistsMongo(credentials)
    .then (data => {
        console.info("data is",data)
        if (!data.length <= 0) {
            credentials = data
            console.info("data is on mongo",credentials)
        } else {
            insertCredentialsMongo(credentials)
            console.info("data is not on mongo inserting")
        }
    })
    const token = signToken(credentials)
    if (CHECK_AND_ADD_USER(credentials.name)) {
        resp.status(406)
        resp.type('application/json')
        resp.json({message:"Already logged in."})
        return
    }
    resp.status(200)
    resp.type("application/json")
    resp.json({message: `Login at ${new Date()}`, token, user: credentials})
})

const CHECK_AND_ADD_USER = (user) => {
    const bool = USER_LOGGED_IN.find(u => {
        return u == user
    })
    if (!bool) {
        USER_LOGGED_IN.push(user)
    }
    return bool
}

// Update display name
app.post('/api/update',
upload.single('image_file'),
async (req, resp) => {
    const payload = JSON.parse(req.body.payload)
    try {
        upsertNameMongo(payload)
        .then (() => {
            if (req.file) {
                const filePath = req.file.path
                console.info(req.body.payload)
                myReadFile(filePath)
                .then (buffer => {
                    console.info("file read",buffer)
                    uploadToS3(buffer, req)
                    .then (key => {
                        console.info("filed uploaded",key)
                        unlinkAllFiles(`${__dirname}/uploads/`)
                        payload.avatar = `https://myfsd2020app.fra1.digitaloceanspaces.com/${key}`
                        upsertAvatarMongo(payload)
                        checkExistsMongo(payload)
                        .then ((user) => {
                            console.info("user updated is",user)
                            for (let i in HOSTS) {
                                // update host name if user updated his name
                                if (HOSTS[i].username = user[0].username) {
                                    HOSTS[i].name = user[0].name
                                    console.info("host change name")
                                }
                            }
                            resp.status(200)
                            resp.type('application/json')
                            resp.json({message:"Profile saved!", user:user})
                    })
                }). catch(e => {
                    console.info(e)
                })
            }) 
            } else {
                checkExistsMongo(payload)
                .then ((user) => {
                    console.info("user updated is",user)
                    for (let i in HOSTS) {
                        // update host name if user updated his name
                        if (HOSTS[i].username = user[0].username) {
                            HOSTS[i].name = user[0].name
                            console.info("host change name")
                        }
                    }
                    resp.status(200)
                    resp.type('application/json')
                    resp.json({message:"Profile saved!", user:user})
                })
            }
        })
    } catch (e) {
        resp.status(400)
        resp.type('application/json')
        resp.json({message:e})
    }
})

// Update password
app.post('/api/updatepassword', async (req, resp) => {
    const decoded = jwt.decode(req.body.token)
    const payload = {
        username:decoded.sub,
        email:decoded.email,
        password:sha256(req.body.password)
    }
    console.info(payload)
    updatePasswordMongo(payload)
    .then(() => {
        console.info("password updated")
        resp.status(200)
        resp.type('application/json')
        resp.json({message:"Password updated!"})
    })
    .catch (e => {
        resp.status(409)
        resp.type('application/json')
        resp.json({message:e})
    })
})

// Logout
app.post('/api/logout', 
(req, resp) => {
    const index = USER_LOGGED_IN.indexOf(req.body.name)
    if (index != -1) {
        USER_LOGGED_IN.splice(index, 1)
    }
    resp.status(200)
    resp.type('application/json')
    resp.json({})
})

// User has refreshed / closed the tab prepare to delete user from USER_LOGGED_IN
app.get('/api/user/startunload/:user', (req, resp) => {
    const user = req.params.user
    const index = USER_LOGGED_IN.indexOf(user)
    if (index != -1) {
        USER_TO_SPLICE[user] = true 
    }
    TIMER_TO_SPLICE[user] = setTimeout(() => {
        if (USER_TO_SPLICE[user] == true) {
            USER_LOGGED_IN.splice(index, 1)
        }
        return
    }, 1000)
    resp.status(200)
    resp.type('application/json')
    resp.json({})
})

// Confirm user executed a refresh and not a tab close, cleartimeout to delete user from USER_LOGGED_IN
app.get('/api/user/stopunload/:user', (req, resp) => {
    const user = req.params.user
    if (USER_TO_SPLICE[user] == true) {
        USER_TO_SPLICE[user] = false
        delete USER_TO_SPLICE[user]
        clearTimeout(TIMER_TO_SPLICE[user])
    }
    resp.status(200)
    resp.type('application/json')
    resp.json({})
})

// POST /api/register
// Create new local account
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

// POST /api/reset
// For user to reset password
app.post('/api/reset', (req, resp) => {
    console.info(req.body)
    checkExistsMongo(req.body)
    .then(data => {
        if (!!data[0]) {
            let token = signResetToken(data[0])
            try {
                token = token.split('.').join('-')
                const url = `http://${req.get('host')}/reset/${token}`
                sendEmail(req.body, url)
                resp.status(200)
                resp.type('application/json')
                resp.json({})
            } catch (e) {
                console.info(e)
                resp.status(403)
                resp.type('application/json')
                resp.json({message:"Error sending email " + e})
            }
        } else {
            resp.status(403)
            resp.type('application/json')
            resp.json({message:"Username / email not found."})            
            return        
        }
    })
})

// POST /api/upload
app.post('/api/upload', 
upload.single('file'), 
async (req, resp) => {
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

// POST /api/check
// Check if token is valid
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
        console.info("message to send",chat)
        ROOMS[code][i].send(chat)
    }
}

// Websocket create / join a room
app.ws('/room', 
(ws, req) => {
    const payload = JSON.parse(req.query.payload)
    const name = payload.name == "server" ? "fake_server" : payload.name
    const username = payload.username
    const code = payload.code
    // need to create a room first or else [name] will have undefined error
    if (!ROOMS[code]) {
        // first time creating room 
        HOSTS[code] = payload
    }
    HOSTS[code].players = HOSTS[code].players ? HOSTS[code].players + 1 : 1
    // create a room[code] if not exist else [username] will have undefined room[code] error
    ROOMS[code] = ROOMS[code] ? ROOMS[code] : {}
    ROOMS[code][username] = ws
    ws.data = payload

    if (HOSTS[code].players >= 5) {
        HOSTS[code].players = HOSTS[code].players - 1
        ROOMS[code][username].close()
        delete ROOMS[code][username]
    }

    console.info("socket data is",ws.data)
    
    if (!!ROOMS[code][username]) {
        const chat = JSON.stringify({
            from: 'Server',
            message: `${name} has joined the room.`,
            ts: (new Date().toTimeString().split(' ')[0])
        })
        // broadcast to everyone in the room if exists (need to have this else will throw error)
        broadcastMsg(code, chat)
    }
        
    ws.on('message', (string) => {
        const data = JSON.parse(string)
        const chat = JSON.stringify({
            from: data.name,
            message: data.message,
            ts: (new Date().toTimeString().split(' ')[0])
        })
        console.info(chat)
        // broadcast to everyone in the room
        broadcastMsg(code, chat)
    })

    ws.on('close', () => {
        console.info("CLOSE 2")
        console.info(`Closing websocket connection for ${name}`)
        // close our end of connection
        if (!!ROOMS[code][username]) {
            ROOMS[code][username].close()
            // remove ourself from the room
            HOSTS[code].players = HOSTS[code].players - 1
            delete ROOMS[code][username]
            if (Object.keys(ROOMS[code]).length <= 0) {
                delete ROOMS[code]
                delete HOSTS[code]
            }
    
            const chat = JSON.stringify({
                from: 'Server',
                message: `${name} has left the room.`,
                ts: (new Date().toTimeString().split(' ')[0])
            })
            broadcastMsg(code, chat)
        }
    })
})

app.get('/api/rooms', 
(req, resp) => {
    resp.status(200)
    resp.type('application/json')
    resp.json({rooms:HOSTS})
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