const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

const port = 5000;
const dbConfig = require('./config/db');

const {isLoggedIn, authenticateToken, refreshToken} = require('./app/api/utils/auth');
const userRouter = require('./app/api/routers/userRouter');
const dashboardRouter = require('./app/api/routers/dashboardRouter');

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


(async () => {
    app.locals.db = await dbConfig.pgPool.connect();
    app.listen(port, function () {
        console.log("Server started at port ", port);
    })
})()


app.use('/user', isLoggedIn, userRouter);
app.use('/', authenticateToken, refreshToken, dashboardRouter)

