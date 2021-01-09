/* -------------------------------------------------------------------------- */
//                      ######## PASSPORT ########
/* -------------------------------------------------------------------------- */
//#region 
const { checkCredentialsMongo } = require('./db_utils.js')
const sha256 = require('sha256')

const LocalStrategy = require('passport-local').Strategy
const Auth0Strategy = require('passport-auth0');

const localStrategy = new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, username, password, done) => {
        try {
            // perform the authentication
            password = sha256(password)
            const data = await checkCredentialsMongo({username, password})
            if (data.length > 0) {
                done(null,
                    // info about the user
                    {
                        username: username,
                        // retrieve profile picture
                        // retrieve match history
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
)

// Authentication function
const mkAuth = (passport, strategy) => {
    return (req, resp, next) => {
        passport.authenticate(strategy,
            (err, user, info) => {
                if (null != err) {
                    resp.status(401)
                    resp.type('application/json')
                    resp.json({ message: err })
                    return
                }
                if (!user) {
                    resp.status(401);
                    resp.type('application/json');
                    resp.json({ info });
                    return;
                  }
                // need to set req.user to user if using custom middleware
                req.user = user
                console.info(user)
                next()
            }
        )(req, resp, next)
    }
}

//#endregion



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

module.exports = {
    localStrategy, mkAuth
}