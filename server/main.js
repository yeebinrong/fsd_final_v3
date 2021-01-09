/* -------------------------------------------------------------------------- */
//                     ######## LOAD LIBRARIES ########
/* -------------------------------------------------------------------------- */
//#region 

const express = require('express')
const secure = require('secure-env')
const morgan = require('morgan')
const cors = require('cors')

const jwt = require('jsonwebtoken')

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
    AWS_ENDPOINT, s3 
} = require('./server_config.js')

const { myReadFile, uploadToS3, unlinkAllFiles, insertCredentialsMongo, checkExistsMongo, checkCredentialsMongo } = require('./db_utils.js')
const { } = require('./helper.js')

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

// Declare the port to run server on
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
// Create an instance of express
const app = express()
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
    const currTime = (new Date()).getTime() / 1000
    const token = jwt.sign({
        sub: req.user.username,
        iss: 'myapp',
        iat: currTime,
        exp: currTime + (30),
        data: {
                // avatar: req.user.avatar,
            loginTime : req.user.loginTime
        }
    }, process.env.ENV_PASSWORD)

    resp.status(200)
    resp.type('application/json')
    resp.json({message: `Login at ${new Date()}`, token})
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
    console.info(exists)
    if (!exists.length <= 0) {
        console.info(true)
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