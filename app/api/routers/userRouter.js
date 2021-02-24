const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

const { check, validationResult} = require('express-validator');

router.get('/login', controller.login);
router.post('/login', [check('username', 'Invalid email.').exists().notEmpty().trim().isEmail().normalizeEmail().escape()], controller.login);

router.get('/register', controller.register);
router.post('/register', [
    check('first_name', 'Invalid first name: Minimum 2 characters required.').exists().notEmpty().trim().isLength({min: 2}).escape(),
    check('last_name', 'Invalid last name.').exists().notEmpty().trim().escape(),
    check('user_email', 'Invalid email.').exists().notEmpty().trim().isEmail().normalizeEmail().escape(),
    check('user_pwd', 'Invalid password: Minimum 6 characters required').exists().notEmpty().trim().isLength({min: 6}).escape().custom((value, {
        req, loc, path }) => {
        if (value !== req.body.confirm_pwd) {
            throw new Error("Password is not matching.");
        } else {
            return value;
        }
    })
], controller.register);

router.get('/logout', controller.logout);

module.exports = router;
