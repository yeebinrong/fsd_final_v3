/* -------------------------------------------------------------------------- */
//                      ######## MONGO / S3 METHODS ########
/* -------------------------------------------------------------------------- */
//#region 
const fs = require('fs')
const path = require('path')

// Retrieve env variables
const { MONGO_DB, mongo, AWS_ENDPOINT, s3, MONGO_COLLECTION } = require('./server_config.js')

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
    const key = req.file.filename;
    const params = {
        Bucket: 'myfsd2020app',
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

// Unlinks all the files stored in directory
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

// Boilerplate to make mongo queries
const mkMongo = (QUERY) => {
    return async (PARAMS) => {
        try {
            return await QUERY(PARAMS)
        } catch (e) {
            return e
        }
    }
}

const MONGO_CHECK_USER_EXISTS = async (PARAMS) => {
    return await mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
    .find({username:PARAMS.username, email:PARAMS.email})
    .toArray()
}

const MONGO_INSERT_CREDENTIALS = (PARAMS) => new Promise((resolve, reject) => {
    mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
    .insertOne(PARAMS, (err,docsInserted) => {
        if (!!err) {
            reject("<At uploadToMongo function> :",err)
        }
        else {
            resolve(docsInserted.insertedId)
        }
    })
})

const MONGO_CHECK_CREDENTIALS = async (PARAMS) => {
    return await mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
    .find({username:PARAMS.username, password:PARAMS.password})
    .toArray()
}

const MONGO_UPDATE_NAME = async (PARAMS) => {
    return await mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
    .updateOne({
        username:PARAMS.username},
        {$set:{
            name:PARAMS.updated
            }   
        },
        {}
    ).upsertedId
}

const MONGO_UPDATE_AVATAR = async (PARAMS) => {
    return await mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
    .updateOne({
        username:PARAMS.username},
        {$set:{
            avatar:PARAMS.avatar
            }   
        },
        {}
    ).upsertedId
}

const MONGO_UPDATE_PASSWORD = async (PARAMS) => {
    return await mongo.db(MONGO_DB).collection(MONGO_COLLECTION)
    .updateOne({
        username:PARAMS.username, email:PARAMS.email},
        {$set:{
            password:PARAMS.password
            }   
        },
        {}
    ).upsertedId
}

const insertCredentialsMongo = mkMongo(MONGO_INSERT_CREDENTIALS)
const checkExistsMongo = mkMongo(MONGO_CHECK_USER_EXISTS)
const checkCredentialsMongo = mkMongo(MONGO_CHECK_CREDENTIALS)
const upsertNameMongo = mkMongo(MONGO_UPDATE_NAME)
const upsertAvatarMongo = mkMongo(MONGO_UPDATE_AVATAR)
const updatePasswordMongo = mkMongo(MONGO_UPDATE_PASSWORD)

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

module.exports = {
    myReadFile, uploadToS3, unlinkAllFiles, checkExistsMongo, checkCredentialsMongo, insertCredentialsMongo, upsertNameMongo, updatePasswordMongo, upsertAvatarMongo
}