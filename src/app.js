const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const authMiddleware = require('../auth/middleware');
const bodyParser = require('body-parser');
const cookieParser =require('cookie-parser');
const hbs = require('hbs');
const jwt = require('jsonwebtoken');

const adminRouter = require('./routers/admin');
const chefRouter = require('./routers/chef');
const courierRouter = require('./routers/courier');
const auth = require('../auth/index');
const menuRouter =  require('./routers/menu');
const {sequelize} = require('./db/connection');
const app = express();
const port = process.env.PORT || 3000;
sequelize.authenticate()
    .then(() => {
        console.log('Соединение установлено');
    })
    .catch(err => {
        console.error('Ошибка соединения');
    });


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

app.use(cookieParser('alex_the_man'));
app.use('/auth',auth);// каждый запрос будет проходить авторизацию
app.options('*', cors());
app.use(cors({
    origin:'http://localhost:3000',
    credentials:true
}));
app.use('/admin',adminRouter);
app.use('/chef',chefRouter);
app.use('/courier',courierRouter);
app.use('/menu',menuRouter);


const imagesDirPath  = path.join(__dirname, '/img');
const pdfPath = path.join(__dirname,'/pdfs');
const viewsPath = path.join(__dirname,'../templates/views');
const partialsPath = path.join(__dirname,'../templates/partials');
console.log(__dirname);
app.set('view engine','hbs');
app.set('views',viewsPath);
hbs.registerPartials(partialsPath);
app.use(express.static(pdfPath));
app.use(function (req,res,next) {
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,OPTIONS,PATCH,DELETE');
    res.header('Access-Control-Allow-Header','Content-Type');
    next();
});
app.use(function (err,req,res,next) {
    res.status(err.status || res.statusCode|| 500);
    res.send({
        message:err.message,
        error:req.app.get('env') === 'development' ? err:{}
    })

})

app.listen(port,()=>{
    console.log(`Server is up on port ${port}.`);
});

