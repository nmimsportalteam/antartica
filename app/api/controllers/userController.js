const bcrypt = require('bcrypt');
const {
    check,
    validationResult
} = require('express-validator');
const saltRounds = 10;

const jwtAuth= require('../utils/auth');

module.exports = {
    login: (req, res, next) => {
        let db = req.app.locals.db;
        let loginToken = req.cookies.token;
        let errors = validationResult(req);

        if (req.method == 'GET') {
            res.render('login')
        } else if (req.method == 'POST') {

            let loginToken = req.cookies.token;
            let errors = validationResult(req);

            if (!errors.isEmpty()) {
                let errorArr = errors.array();
                let username = req.body.username;

                res.render('login', {
                    errors: errorArr,
                    username: username
                });
            }

            (async () => {

                let userData = await new Promise(resolve => {
                    const userStmt = {
                        text: `SELECT first_name, last_name, email, password, (SELECT employee_id FROM employees WHERE user_id = users.id) AS employee_id FROM users WHERE email = $1`,
                        values: [req.body.username]
                    }
                    db.query(userStmt, async (err, obj) => {
                        if (err) throw err;
                        let result = await obj.rows;
                        if (result.length == 0) {
                            return res.render("login", {
                                isLoggedIn: false,
                                msg: "Username or password is invalid",
                                username: req.body.username
                            })
                        } else {
                            return resolve(result[0]);
                        }
                    })
                })

                let verifyPass = await new Promise(resolve => {
                    bcrypt.compare(req.body.password, userData.password, (err, result) => {
                        if (err) throw err;

                        if (result) {
                            let username = req.body.username;
                            const token = jwtAuth.sign(username)

                            res.cookie("token", token, { maxAge: jwtAuth.jwtExpirySeconds * 1000 })
                            res.redirect('/')

                        } else {
                            return res.render("login", {
                                msg: "Username or password is invalid",
                                isLoggedIn: false
                            })
                        }
    
                    });
    
                })


            })()

        }
    },

    register: (req, res, next) => {
        let db = req.app.locals.db;
        let loginToken = req.cookies.token;
        let errors = validationResult(req);

        if (req.method === 'GET') {
            res.render('register')
        } else if (req.method === 'POST') {

            let userInputObj = {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                user_email: req.body.user_email,
                org_name: req.body.org_name
            };

            (async () => {

                let validate = await new Promise(function (resolve) {
                    if (!errors.isEmpty()) {
                        let errorArr = errors.array();
                        let filteredError = errorArr.filter((val, index, arr) => arr.findIndex(t => (t.param === val.param)) === index);
        
                        res.render("register", {
                            errors: filteredError,
                            userInput: userInputObj
                        });
                    } else {
                        resolve(1);
                    }
                });

                let emailCount = await new Promise(function (resolve) {
                    const stmtCheckEmail = {
                        text: "SELECT COUNT(id) FROM users WHERE email = $1",
                        values: [req.body.user_email]
                    }
                    db.query(stmtCheckEmail, async function (err, result) {
                        if (err) throw err;
                        let emailCount = await result.rows[0].count
                        return resolve(emailCount)
                    })
                });

                let checkUniqueness = await new Promise(function (resolve) {
                    if (emailCount != 0) {
                        res.render("register", {
                            isEmailUnique: 'no',
                            msg: 'This email is already taken.',
                            userInput: userInputObj
                        });
                    } else {
                        return resolve(1);
                    }
                });

                let bcryptPassword = await new Promise(async (resolve) => {
                    let hashedPwd = await bcrypt.hash(req.body.user_pwd, saltRounds);
                    return resolve(hashedPwd);
                });

                let insertedUser = await new Promise(function (resolve) {
                    const stmt = {
                        text: `SELECT register_user($1, $2, $3, $4, $5) AS uder_id`,
                        values: [req.body.first_name, req.body.last_name, req.body.user_email, bcryptPassword, req.body.org_name]
                    }
                    db.query(stmt, async function (err, result) {
                        if (err) throw err;
                        let user = await result.rows[0];
                        return resolve(user)
                    })
                });

                res.redirect('/user/login');

            })()


        }
    },

    logout: (req, res, next) => {
        res.clearCookie('token');
        res.redirect('/user/login');
    }
}