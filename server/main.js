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
const LocalStrategy = require('passport-local').Strategy

const { MongoClient} = require('mongodb')
const AWS = require('aws-sdk')
const multer = require('multer')
const fs = require('fs')

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
//             ######## DECLARE VARIABLES & CONFIGURATIONS ########
/* -------------------------------------------------------------------------- */
//#region

// Retrieve environment variables from .env
global.env = secure({secret: process.env.ENV_PASSWORD})


//######## MONGO ########
const MONGO_USER = global.env.MONGO_USER
const MONGO_PASS = global.env.MONGO_PASS
const MONGO_DB = global.env.MONGO_DB
const MONGO_COLLECTION = global.env.MONGO_COLLECTION
const MONGO_COLLECTION2 = global.env.MONGO_COLLECTION2
// const MONGO_URL = global.env.MONGO_URL
// const MONGO_URL = 'mongodb://localhost:27017'
const MONGO_URL = `mongodb://${MONGO_USER}:${MONGO_PASS}@localhost:27017/${MONGO_DB}`
// MONGO CONFIUGRAIONS
const mongo = new MongoClient(MONGO_URL, {
        useNewUrlParser: true, useUnifiedTopology: true
    }
)


//######## AWS S3 ########
const AWS_ENDPOINT = new AWS.Endpoint(global.env.DIGITALOCEAN_ENDPOINT)

// S3 Configurations
const s3 = new AWS.S3({
    endpoint: AWS_ENDPOINT,
    accessKeyId: global.env.DIGITALOCEAN_ACCESS_KEY,
    secretAccessKey: global.env.DIGITALOCEAN_SECRET_ACCESS_KEY
})


// Configure passport with a strategy
passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, username, password, done) => {
        try {
            // perform the authentication
            const data = (await QUERY_SELECT_USER_PASS_WITH_USER([username, password]))
            if (data.length > 0) {
                done(null,
                    // info about the user
                    {
                        username: username,
                        loginTime: (new Date().toString()),
                        security: 2
                    }
                )
            } else {
                // Incorrect login
                done('Incorrect username and/or password', false)
            }
        } catch (e) {
            done(`Error authenticating: ${e}`, false)
        }
    }
))


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
//                          ######## METHODS ########
/* -------------------------------------------------------------------------- */
//#region

// Reads the file using fs and returns the buffer as a promise
const myReadFile = (file) => new Promise((resolve, reject) => {
    fs.readFile(file, (err, buffer) => {
        if (err == null) {
            resolve(buffer)
        } else {
            reject("<At myReadfile Function> ", err)
        }
    })
}) 

// Handles the uploading to AWS S3 and returns the key as a promise
const uploadToS3 = (buffer, req) => new Promise((resolve, reject) => {
    const key = req.file.filename + '_' + req.file.originalname;
    const params = {
        Bucket: 'paf2020',
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: req.file.mimetype,
        ContentLength: req.file.size,
        Metadata: {
            originalName: req.file.originalname,
            createdTime: '' + (new Date()).getTime(),
        }
    }
    s3.putObject(params, (err, result) => {
        if (err == null) {
            resolve(key)
        } else {
            reject("<At uploadToS3 Function> ", err)
        }
    })
})

const unlinkAllFiles = (directory) => new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
        if (err) reject("<At unlinkAllFiles Function> ", err)
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) reject("<At unlinkAllFiles Function> ", err)
          });
        }
        resolve()
    });
})

        // make a boilerplate for mongoupload
const uploadToMongo = (data) => new Promise((resolve, reject) => {
    const toUpload = {
        title: data.title,
        comments: data.comments,
        img_key: data.key,
        ts: new Date()
    }
    mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
        .insertOne(toUpload, (err,docsInserted) => {
            if (!!err) {
                reject("<At uploadToMongo function> :",err)
            }
            else {
                resolve(docsInserted.insertedId)
            }
        })
})

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
// Apply cors headers to resp
app.use(cors())

// POST /api/login
app.post('/api/login', (req, resp) => {
    console.info(req.body.username)
    console.info(req.body.password)
    // Validate credentials
    if (req.body.username == "a") {
        resp.status(200)
        resp.type('application/json')
        resp.json({token: "testing token", message: ""},)            
    }
    resp.status(401)
    resp.type('application/json')
    resp.json({token: "testing token", message: "Please check your username/password."},)
})

app.post('/api/register', (req, resp) => {
    // check if username already exists
    // insert into mongodb if not exists
    // return success or fail
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