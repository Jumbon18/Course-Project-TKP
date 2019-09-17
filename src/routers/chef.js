const express = require('express');
const chalk = require('chalk');
const router = new express.Router();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { User, Manager_order,courier_order,chef_order,Manager_menu,menu } = require('../db/connection');
const {ensureLoggedIn,asyncForEach,findAllInfoForSingle} = require('../../auth/middleware');
// забераем все заказы для повара
router.get('/all/:category',ensureLoggedIn,async(req,res,next)=>{
    //Todo: Переделать
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e)=>{
        if(e.includes(req.token)){
            return isInclude = true;
        }
    });
    const allChefData = [];
    try {
        let orders=[] ;
        let ids =[];

        const AllOrderChef = await chef_order.findAll({where:{userUserId:req.user.user_id}});
            console.log(chalk.bgGreenBright(AllOrderChef));
            if(req.params.category === 'current'){
                console.log(chalk.bgBlue('dsa'));
                await asyncForEach(AllOrderChef,async (order,index)=>{
                    const findOrderManager = await Manager_order.findOne({where:{chefOrderChefOrderId:order.chef_order_id,status:'Готовиться'}});
                    if(findOrderManager){
                        ids.push( order.chef_order_id);
                        orders.push(findOrderManager);
                    }
                    console.log(chalk.bgCyan(orders), chalk.red('as;das;dljasd'));

                    return orders;
                }) ;

        }
        else if (req.params.category === 'success'){

                        await asyncForEach(AllOrderChef,async (order,index)=> {
                            const findOrderManager = await Manager_order.findOne({
                                where: {
                                    chefOrderChefOrderId: order.chef_order_id,
                                    status: {
                                        [Op.or]:['Доставлен','В пути']
                                    }
                                }
                            });
                        /*    const test2 = await Manager_order.findOne({where: {
                                    courierOrderCourierOrderId: order.chef_order_id,
                                    status: 'В пути'
                                }});
                            if(test2){
                                ids.push(order.chef_order_id);
                                orders.push(test2);
                            }*/
                            if (findOrderManager) {
                                ids.push( order.chef_order_id);
                                orders.push(findOrderManager);
                            }
                            console.log(chalk.bgCyan(orders), chalk.red('as;das;dljasd'));
                            return orders;
                        });
        }
        const start = async () => {
            await asyncForEach(orders, async (order, index) => {
                const dishesForOrder = await Manager_menu.findAll({where: {managerOrderOrderId: order.order_id}});
                const el  = await Manager_order.findOne({where:{chefOrderChefOrderId:order.chefOrderChefOrderId}});
                Object.keys(el).forEach((prop,index)=>{
                    order[prop] = el[prop];
                });
                allChefData[index] = {order, amount: dishesForOrder, dishes: [],chef_order_id:ids[index]};
               await asyncForEach(dishesForOrder,async(dish,dishIndex)=>{
                   const findDish = await menu.findOne({where: {dish_id: dish.menuDishId}});
                   allChefData[index].dishes[dishIndex] = findDish;
               });
            });
            return allChefData;
        };
        const result = await start();
        res.send(result);
    } catch (e) {
        next(new Error(e));
    }
    });
router.get('/:id',ensureLoggedIn,async(req,res,next)=>{
    console.log(req.user.tokens);
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e) => {if (e.includes(req.token)) {return isInclude = true;}});
    if (isInclude) {
        try {
            const result =  await findAllInfoForSingle('chef',req.params.id);
            console.log(result);
            const courierAttributes = ['createdAt'];
            const obj = {
                data:{chefOrderChefOrderId:result.order.chefOrderChefOrderId},
                dishes: result.dishes,
                amount:result.amount,
                value:['Заказ № ','Создан','Администратор']
            };

            courierAttributes.forEach((el,index)=>{
                obj.data[el]=result.order[el];
            });
            const findManager = await User.findOne({where:{user_id:result.order.userUserId}});
            obj.manager =`${findManager.firstName} ${findManager.secondName}`;
            obj.url = '/chef/all/current';
            res.send(obj);
        } catch (e) {
            res.status(500);
            console.log(req.body);
            next(new Error(`Smth went wrong with opening clicked order ${e}`))
        }
    }
});
// Когда заказ готов - изменяем статус
router.patch('/:id',ensureLoggedIn,async(req,res,next)=>{
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
        try {
            const findChefOrder = await chef_order.findOne({
                where: {
                    chef_order_id: req.params.id,
                    userUserId: req.user.user_id
                }
            });
            if (findChefOrder) {
                const findManagerOrder = await Manager_order.findOne({where: {chefOrderChefOrderId: findChefOrder.chef_order_id}});
                if (findManagerOrder) {
                    findManagerOrder.status = 'В пути';
                    await findManagerOrder.save();
                    res.send(findManagerOrder);
                } else {
                    res.status(404);
                    next(new Error('Order doesnt exist in Manager orders'));
                }
            } else {
                res.status(404);
                next(new Error('Order doesnt exist'));
            }
        } catch (e) {
            res.status(500);
            next(new Error('Smth went wrong'))
        }
    }
});

module.exports =router;