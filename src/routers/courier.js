const express = require('express');
const chalk = require('chalk');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const router = new express.Router();
const {User, Manager_order, courier_order, chef_order, report, Manager_menu, menu} = require('../db/connection');
const {ensureLoggedIn, asyncForEach, findAllInfoForSingle, createReport} = require('../../auth/middleware');


// забераем все заказы для курьера
router.get('/all/:category', ensureLoggedIn, async (req, res, next) => {
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    const allCourierData = [];
    try {
        let orders = [];
        let ids = [];
        const AllOrderCourier = await courier_order.findAll({where: {userUserId: req.user.user_id}});
        console.log(chalk.bgGreenBright(AllOrderCourier));
        if (req.params.category === 'current') {
            console.log(chalk.bgBlue('dsa'));
            await asyncForEach(AllOrderCourier, async (order, index) => {
                const findOrderManager = await Manager_order.findOne({where: {
                        courierOrderCourierOrderId: order.courier_order_id,
                        status:{
                            [Op.or]:['Готовиться','В пути']
                        }
                    }
                });
                if (findOrderManager) {
                    ids.push(order.courier_order_id);
                    orders.push(findOrderManager);
                }

                console.log(chalk.bgCyan(orders), chalk.red('as;das;dljasd'));

                return orders;
            });

        } else if (req.params.category === 'success') {

            await asyncForEach(AllOrderCourier, async (order, index) => {
                const findOrderManager = await Manager_order.findOne({
                    where: {
                        courierOrderCourierOrderId: order.courier_order_id,
                        status: 'Доставлен'
                    }
                });
                if (findOrderManager) {
                    console.log(chalk.bgBlackBright(typeof findOrderManager));
                    ids.push(order.courier_order_id);
                    orders.push(findOrderManager);
                }

                console.log(chalk.bgCyan(orders), chalk.red('as;das;dljasd'));
                return orders;
            });
        }
        const start = async () => {
            await asyncForEach(orders, async (order, index) => {
                const dishesForOrder = await Manager_menu.findAll({where: {managerOrderOrderId: order.order_id}});
                const el = await Manager_order.findOne({where: {courierOrderCourierOrderId: order.courierOrderCourierOrderId}});
                Object.keys(el).forEach((prop, index) => {
                    console.log(prop);
                    order[prop] = el[prop];
                });
                allCourierData[index] = {order, amount: dishesForOrder, dishes: [], courier_order_id: ids[index]};
                await asyncForEach(dishesForOrder, async (dish, dishIndex) => {
                    const findDish = await menu.findOne({where: {dish_id: dish.menuDishId}});
                    allCourierData[index].dishes[dishIndex] = findDish;
                });
            });
            return allCourierData;
        };
        const result = await start();
        console.log(result);

        res.send(result);
    } catch (e) {
        next(new Error(e));
    }
});
// Просмотр определенного заказа
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    console.log(req.user.tokens);
    const tokens = req.user.tokens;
    let isInclude = false;
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
        try {
            const result = await findAllInfoForSingle('courier', req.params.id);
            console.log(result);

            const Start = JSON.stringify(result.order.createdAt).split('T');
            const time = Start[1].split('.');
            const resDate = Start[0].split('-');
            const resTime = time[0].split(':');
            const res1 = `${resDate[2]}.${resDate[1]}.${resDate[0]}`;
            const res2 = `${resTime[0]}:${resDate[1]}`;

            const courierAttributes = ['address', 'client_phone', 'createdAt', 'deliveredTime'];
            const obj = {
                data: {courierOrderCourierOrderId: result.order.courierOrderCourierOrderId},
                dishes: result.dishes,
                amount: result.amount,
                value: ['Заказ № ', 'Ф.И.О', 'Адресс', 'Телефон', 'Создан', 'Доставлен', 'Администратор']
            };
            obj.data.FIO = `${result.order.client_name} ${result.order.client_surname}`;

            courierAttributes.forEach((el, index) => {
                if (el === 'createdAt') {
                    obj.data[el] = `${res1} ${res2}`
                } else {
                    obj.data[el] = result.order[el];
                }
            });

            const findManager = await User.findOne({where: {user_id: result.order.userUserId}});
            obj.manager = `${findManager.firstName} ${findManager.secondName}`;
            obj.url = '/courier/all/current';

            // {  order:{client_name,client_surname,client_address,client_phone,createdAt,userUserId}, amount:[],dishes[]
            res.send(obj);
        } catch (e) {
            res.status(500);
            console.log(req.body);
            next(new Error('Smth went wrong with opening clicked order'))
        }
    }
});
// Когда заказ доставлен - изменяем статус
router.patch('/:id', ensureLoggedIn, async (req, res, next) => {
    console.log(req.params.id);
    const tokens = req.user.tokens;
    let isInclude = false;
    let d = new Date();
    let curr_date = d.getDate();
    let curr_month = d.getMonth() + 1;
    let curr_year = d.getFullYear();
    let hours = d.getHours();
    let minutes = d.getMinutes();

    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
        }
    });
    if (isInclude) {
        try {
            const findCourierOrder = await courier_order.findOne({
                where: {
                    courier_order_id: req.params.id,
                    userUserId: req.user.user_id
                }
            });
            if (findCourierOrder) {
                const findManagerOrder = await Manager_order.findOne({where: {courierOrderCourierOrderId: findCourierOrder.courier_order_id}});

                if (findManagerOrder) {
                    findManagerOrder.status = 'Доставлен';
                    findManagerOrder.deliveredTime=`${curr_year}-${curr_month}-${curr_date} ${hours}:${minutes} `;

                    await findManagerOrder.save();
                    const result = await findAllInfoForSingle('courier', req.params.id);

                    const newReport = await report.create({
                        chefOrderChefOrderId: findManagerOrder.chefOrderChefOrderId,
                        courierOrderCourierOrderId: findManagerOrder.courierOrderCourierOrderId,
                        managerOrderOrderId: findManagerOrder.order_id,
                        url: `http://localhost:3000/${result.order.order_id}_order.pdf`
                    });
                    await createReport(result);
                    res.send({findManagerOrder, newReport, result});
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
            next(new Error(e));

        }
    }
});
module.exports = router;