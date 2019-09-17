const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const ManagerModel = require('./models/manager_order');
const UserModel = require('./models/user');
const ChefModel = require('./models/сhef_order');
const courierModel = require('./models/courier_order');
const menuModel = require('./models/menu');
const productModel = require('./models/product');
const reportModel = require('./models/report');
const Manager_menuModel = require('./models/Manager_menu');
const Menu_productModel = require('./models/Menu_product');

const  sequelize= new Sequelize('Sushi', 'postgres', 'admin', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

const User = UserModel(sequelize, Sequelize);
const Manager_order = ManagerModel(sequelize, Sequelize);
const chef_order = ChefModel(sequelize,Sequelize);
const courier_order = courierModel(sequelize,Sequelize);
const menu = menuModel(sequelize,Sequelize);
const product = productModel(sequelize,Sequelize);
const report = reportModel(sequelize,Sequelize);
const Manager_menu = Manager_menuModel(sequelize,Sequelize);
const Menu_product = Menu_productModel(sequelize,Sequelize);

// связка админа и заказов
Manager_order.belongsTo(User);
User.hasMany(Manager_order);

// связка курьера и закзов
Manager_order.belongsTo(courier_order);
courier_order.hasMany(Manager_order);
User.hasMany(courier_order);

// связка заказов и повара
Manager_order.belongsTo(chef_order);
chef_order.hasMany(Manager_order);
User.hasMany(chef_order);

//связка отчетов
report.belongsTo(chef_order);
report.belongsTo(courier_order);
report.belongsTo(Manager_order);
chef_order.hasMany(report);
courier_order.hasMany(report);
Manager_order.hasMany(report);



// Промежточная таблица между Заказом  - и - Меню т.к отношение многи-ко-многим
Manager_order.belongsToMany(menu, {through: Manager_menu});
menu.belongsToMany(Manager_order, {through: Manager_menu});

// Промежточная таблица между Меню  - и - Продуктом т.к отношение многи-ко-многим
menu.belongsToMany(product, {through: Menu_product});
product.belongsToMany(menu, {through: Menu_product});


sequelize.sync({ force: false })
    .then(() => {
        console.log(`Database & tables created!`)
    });


module.exports = {
    User,
    Manager_order,
    chef_order,
    courier_order,
    menu,
    report,
    product,
    Manager_menu,
    Menu_product,
    sequelize
};