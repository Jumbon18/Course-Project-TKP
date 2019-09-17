const jwt=require('jsonwebtoken');
const  chalk = require('chalk');
const {User,Manager_order,Manager_menu,menu,courier_order,chef_order} = require('../src/db/connection');
const PDFDocument = require('pdfkit');
const doc = new PDFDocument;
const  fs = require('fs');

async function createReport(final){
    const price = final.dishes.map((el)=>{
        return el.dishPrice;
    });console.log(chalk.bgGreen(final.order.deliveredTime));
    const Start = JSON.stringify(final.order.createdAt).split('T');
    const time = Start[1].split('.');
    const resDate = Start[0].split('-');
    const resTime = time[0].split(':');
    const res1 = `${resDate[2]}.${resDate[1]}.${resDate[0]}`;
    const res2 = `${resTime[0]}:${resDate[1]}`;
    const courierOrder = await courier_order.findOne({where:{courier_order_id:final.order.courierOrderCourierOrderId}});
    const courier = await User.findOne({where:{user_id:courierOrder.userUserId}});

    const chefOrder = await chef_order.findOne({where:{chef_order_id:final.order.chefOrderChefOrderId}});
    const chef = await User.findOne({where:{user_id:chefOrder.userUserId}});

    const manager = await User.findOne({where:{user_id:final.order.userUserId}});
    const summ = price.reduce((sum,current,index)=>{
        return sum + (current * final.amount[index].dish_amount );
    });
    doc.pipe(fs.createWriteStream(__dirname + `/../src/pdfs/${final.order.order_id}_order.pdf`)); // write to PDF
    doc.font(__dirname + '/../src/fonts/DejaVuSans.ttf')
        .fontSize(14);
    doc.moveDown();

    doc.text(`Ф.И.О : ${final.order.client_name} ${final.order.client_surname}`,{
        align:'left'});
    doc.moveDown();

    doc.text(`Email : ${final.order.email}`,{
        align: 'left'
    });
    doc.moveDown();

    doc.text(`Адресс : ${final.order.address}`,{align:'left'});
    doc.moveDown();

    doc.text(`Телефон : ${final.order.client_phone}`,{align:'left'});
    doc.moveDown();

    doc.text(`Блюда : `,{align:'left'});
    doc.moveDown();

    final.dishes.forEach((el,index)=>{
        doc.text(`${index + 1} : ${el.dish_name}                       ${final.amount[index].dish_amount} кол-во                       Цена : ${el.dishPrice} грн.`);
        doc.moveDown();
    });
    doc.text(`К оплате : ${summ} грн.`,{
        align:'right'
    });
    doc.moveDown();

    doc.text(`Менеджер : ${manager.firstName} ${manager.secondName}`);
    doc.moveDown();
    doc.text(` Курьер : ${courier.firstName} ${courier.secondName}`);
    doc.moveDown();
    doc.text(` Повар : ${chef.firstName} ${chef.secondName}`);
    doc.moveDown();
    doc.text(`Дата создания : ${res1} ${res2}` );
    doc.moveDown();
    doc.text(`Дата завершения : ${JSON.stringify(final.order.deliveredTime)}` );
    doc.end();
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function ensureLoggedIn(req,res,next) {


  try{
      const token = req.header('Authorization').replace('Bearer ','');
      const decode = jwt.verify(token,'thisismycode');
      console.log(decode);
      const user = await User.findOne({where:{user_id:decode._id}});

             if (!user) {
                 throw new Error();
             }
             req.token = token;
             req.user = user;
             next();


  }catch (e) {
      res.status(401).send({error:`Please authenticate ${e}`});
  }
}
function allowAccess(req,res,next){
    if(req.signedCookies.user_id === req.params.id){// Если есть куки
        next();
    }else{
        res.status(401);
        next(new Error('Un-Authorized'));
    }
}
async function findAllInfoForSingle(Type,id,next) {
    let singleData = {
        dishes: []
    };
    try {
        if (Type === 'chef') {
            singleData.order = await Manager_order.findOne({where: {chefOrderChefOrderId: id}});
        } else if (Type === 'courier') {
            singleData.order = await Manager_order.findOne({where: {courierOrderCourierOrderId: id}});
        }
        else if(Type === 'admin'){
            singleData.order  = await Manager_order.findOne({where: {order_id: id}});

        }
        const start = async () => {
            singleData.amount = await Manager_menu.findAll({where: {managerOrderOrderId: singleData.order.order_id}});
            await asyncForEach(singleData.amount, async (dish, dishIndex) => {
                const findDish = await menu.findOne({where: {dish_id: dish.menuDishId}});
                singleData.dishes[dishIndex] = findDish;
            });
            return singleData;

        };
        const result = await start();
        return result;
    } catch (e) {
        console.log(e);
    }
}
async function adminMenuAccess(req,res,next){

  console.log(chalk.bgBlackBright(req.token));
    let isInclude = false;
    const tokens = req.user.tokens;

    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
            if (req.user.position === 'админ') {
                next();
            } else {
                res.status(404);
                next(new Error('Limit access'));
            }
        } else {
            res.status(401);
            next(new Error('Un-Authorized'));
        }
    }

    function checkOriginalURL(req,res,next){
   if(req.originalUrl){}
    }
module.exports={
    createReport,ensureLoggedIn,allowAccess,adminMenuAccess,asyncForEach,findAllInfoForSingle
};