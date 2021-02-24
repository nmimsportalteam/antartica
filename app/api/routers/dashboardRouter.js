const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');

const { check, validationResult} = require('express-validator');

router.get('/', controller.getDashboard);
router.use('/userList', controller.userList)

module.exports = router;
