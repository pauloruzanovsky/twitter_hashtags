import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'
import session from 'express-session'
import dotenv from 'dotenv'
import User from '../models/User.js'
import { db } from '../config/database.js';

dotenv.config({ path: './config/config.env' });

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await db.collection('users').findOne({ googleId: profile.id })
                
                if(user) {
                    done(null, user)
                } else {
                    user = new User ({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        picture: profile.photos[0].value
                    })
                    db.collection('users').insertOne(user, (err, result) => {
                        if(err) {
                            console.log('Failed to add user:', err)
                            return
                        }
                        console.log('User added: ', result.insertedId)
                    })
                    done(null, user)

                }
            } catch (error) {
                done(error, false)
            }

        }
    )
)

passport.serializeUser((user,done) => {
    done(null, user)
})

passport.deserializeUser((user,done) => {
    done(null, user)
})

export default function googleSetup(app) {
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    }))
    app.use(passport.initialize())
    app.use(passport.session())
}