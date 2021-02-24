const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtKey = process.env.JWT_SECRET;
const jwtExpirySeconds = 300;

module.exports = {
    jwtExpirySeconds: jwtExpirySeconds,

    isLoggedIn: (req, res, next) => {
        const token = req.cookies.token;
        if (req.url !== '/logout') {
            if (token) {
                return res.redirect('/');
            }
        }
        next();
    },

    sign: (username) => {
        return jwt.sign({
            username
        }, jwtKey, {
            algorithm: "HS256",
            expiresIn: jwtExpirySeconds
        })
    },

    authenticateToken: (req, res, next) => {
        const token = req.cookies.token
        if (!token) {
            return res.redirect('/user/login');
        }

        let payload;
        try {
            payload = jwt.verify(token, jwtKey)
        } catch (e) {
            if (e instanceof jwt.JsonWebTokenError) {
                res.clearCookie('token');
                return res.redirect('/user/login');
            }
            return res.status(400).end()
        }
        next();
    },

    refreshToken: (req, res, next) => {

        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/user/login');
        }

        let payload;
        try {
            payload = jwt.verify(token, jwtKey)
        } catch (e) {
            if (e instanceof jwt.JsonWebTokenError) {
                res.clearCookie('token');
                return res.redirect('/user/login');
            }
            return res.status(400).end()
        }

        const nowUnixSeconds = Math.round(Number(new Date()) / 1000)
        if (payload.exp - nowUnixSeconds > 60) {
            next();
        } else {
            const newToken = jwt.sign({
                username: payload.username
            }, jwtKey, {
                algorithm: "HS256",
                expiresIn: jwtExpirySeconds,
            })

            res.cookie("token", newToken, {
                maxAge: jwtExpirySeconds * 1000
            })
            next();
        }
    }
}