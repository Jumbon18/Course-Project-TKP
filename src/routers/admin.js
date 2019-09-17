const chulk = require('chalk');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const express = require('express');
const router = new express.Router();
const authMiddleware = require('../../auth/middleware');
const {asyncForEach,findAllInfoForSingle,ensureLoggedIn} = require('../../auth/middleware');
const {User, Manager_order, courier_order, chef_order, Manager_menu, menu,report} = require('../db/connection');


router.get('/users/me', authMiddleware.ensureLoggedIn, async (req, res) => {
    res.send(req.user);

});
router.delete('/:id',async(req,res)=>{
   await Manager_order.destroy({where:{order_id:req.params.id}});
   res.send('OKAY');
});
router.get('/', async (req, res) => {
    res.render('admin');
});

router.get('/all/:category', authMiddleware.ensureLoggedIn, async (req, res,next) => {
    const tokens = req.user.tokens;
    let isInclude = false;
    console.log(chulk.green(req.params.category));
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
        const allAdminData = [];
        try {
            let orders;
            if(req.params.category === 'current'){
            console.log(chulk.bgBlue('I am here'));
                orders = await Manager_order.findAll({where: {userUserId: req.user.user_id,status:{
                    [Op.or]:['Ожидание','В пути','Готовиться']}}});

                console.log(orders);
            }
            else if (req.params.category === 'success'){
                orders = await Manager_order.findAll({where: {userUserId: req.user.user_id,status:'Доставлен'}});
            }
            console.log(orders);
            const start = async () => {
                await asyncForEach(orders, async (order, index) => {
                    const dishesForOrder = await Manager_menu.findAll({where: {managerOrderOrderId: order.order_id}});
                    allAdminData[index] = {order, amount: dishesForOrder, dishes: []};
                        const findReport= await report.findOne({where:{managerOrderOrderId:order.order_id}});
                if(findReport){
                    allAdminData[index].url = findReport.url;
                }
                    await asyncForEach(dishesForOrder, async (dish, dishIndex) => {
                        const findDish = await menu.findOne({where: {dish_id: dish.menuDishId}});
                        allAdminData[index].dishes[dishIndex] = findDish;
                    });
                });
                return allAdminData;
            };

            const result = await start();


            console.log(result);
            res.send(result);
        } catch (e) {
next(new Error(e));
        }
    } else {
        res.status(401);
        next(new Error('Un-authorized user'))
    }
});
router.get('/singular/:id',ensureLoggedIn, async (req, res,next) => {
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
        try {
            const result = await findAllInfoForSingle('admin', req.params.id);

            res.send(result);
        } catch (e) {
            res.status(404);
            next(new Error('Order doesnt exist '));
        }
    }
});
// создание заказа
router.post('/', async (req, res, next) => {
    const dishes = req.body.dishes;
    try {
        const findAdmin = await User.findOne({where: {position: 'админ'}});
        if(findAdmin) {

            const newOrder = await Manager_order.create({userUserId:findAdmin.user_id,...req.body},{dishes});
          //TODO:HOOK
           /* newOrder.createDishes(newOrder.order_id,req.body.dishes);*/
         /*   dishes.forEach(async (order) => {
                await Manager_menu.create({managerOrderOrderId: newOrder.order_id, menuDishId: order.dish_id,dish_amount:order.dish_amount});
            });*/
            const newOrderMenu = Manager_menu.findAll({where: {managerOrderOrderId: newOrder.order_id}});
            res.json({message: '✔', newOrder, newOrderMenu});
        }
    } catch (e) {
        res.status(500);

        next(new Error(`invalid order parameters ${e}`))
    }
});

// обновление заказа(статус и добавление в табл курьера и повара)
router.patch('/:id',authMiddleware.ensureLoggedIn, async (req, res, next) => {
    const updates = Object.keys(req.body);
    const updatesAllow = ['order_id', 'status', 'address', 'notes', 'deliveredTime', 'paymentType', 'courierOrderCourierOrderId', 'chefOrderChefOrderId'];
    const isValidation = updates.every((update) => updatesAllow.includes(update));
    console.log(req.params.id,req.params.dishId);
  console.log(req.body);
    try {
        const order = await Manager_order.findOne({where: {order_id: req.params.id, userUserId: req.user.user_id}});//TODO:ПЕРЕДЕЛАТЬ ПОД КУКИ
        console.log(order);
        if (order) {
            // Если у нас измения в количесвто блюда то изменяем только блюдо
            if (req.body.dish_amount) {
                const ManagerMenuOrder = await Manager_menu.findOne({
                    where: {
                        managerOrderOrderId: order.order_id,
                        menuDishId: req.body.menuDishId
                    }
                });
                if (ManagerMenuOrder) {
                    console.log(req.body.dish_amount);
                    ManagerMenuOrder.dish_amount = req.body.dish_amount;
                    await ManagerMenuOrder.save();
                    const result =  await findAllInfoForSingle('admin',req.params.id);

                    res.send(result);
                } else {
                    res.status(404);
                    next(new Error('No such order in DB'));
                }

            }
            // Изменяем только значения которые находятся в таблице Manager_order
            else {
                /*  if(!isValidation){

                   return   res.status(404).send({error:'Invalid updates field'});
                  }*/
                updates.forEach((update) => order[update] = req.body[update]);

                // Если изменяем стаус - то добавляем курьеру и повару заказ
                if (req.body.status === 'Готовиться') {
                    const findCourier = await User.findOne({where: {position: 'курьер'}});
                    console.log(findCourier);
                    const findChef = await User.findOne({where: {position: 'повар'}});

                    if (findChef && findCourier) {
                        const newChefOrder = await chef_order.create({userUserId: findChef.user_id});
                        const newCourierOrder = await courier_order.create({userUserId: findCourier.user_id});

                        order.chefOrderChefOrderId = newChefOrder.chef_order_id;
                        order.courierOrderCourierOrderId = newCourierOrder.courier_order_id;

                    } else {
                        res.status(404);
                        next(new Error('Cannot find courier or chef'));
                    }
                }
                await order.save();
                const result =  await findAllInfoForSingle('admin',req.params.id);

                res.send(result);
            }
        } else {
            res.status(404);
            next(new Error('order doesnt exist'));
        }
    } catch (e) {
        next(new Error(`Smth wrong with order ${e}`))
    }
});
router.post('/:id',ensureLoggedIn, async (req, res,next) => {
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
        try {
            const newOrder = await Manager_menu.create({
                managerOrderOrderId: req.params.id,
                menuDishId: req.body.dish_id,
                dish_amount: req.body.dish_amount
            });
            const result = await findAllInfoForSingle('courier', req.body.id);

            res.send(result);
        }catch (e) {
            next(new Error(e));
        }
    }
});
// удаление блюда из заказа
router.delete('/:id/:dishId', async (req, res, next) => {
   console.log(req.config);
    try {
        const findDeletedOrder = await Manager_menu.findOne({
            where: {
                managerOrderOrderId: req.params.id,
                menuDishId: req.params.dishId
            }
        });
        const deleteOrder = await Manager_menu.destroy({
            where: {
                managerOrderOrderId: req.params.id,
                menuDishId: req.params.dishId
            }
        });
        const result = await findAllInfoForSingle('admin', req.params.id);

        if (!deleteOrder) {
            return res.status(404).send({error: "NOt found task"});
        }
        res.send(result);
    } catch (e) {
        res.status(500);
        next(new Error(`Smth wrong with deleting order ${e}`));
    }
});

function resError(res, statusCode, message) {
    res.status(statusCode);
    res.json({message});
}


module.exports = router;
