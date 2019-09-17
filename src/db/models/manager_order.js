const validator = require('validator');
const chalk = require('chalk');
const {User, Manager_order, courier_order, chef_order, Manager_menu, menu,report} = require('../connection');

module.exports = (sequelize, DataTypes) => {

    const manager_order = sequelize.define('manager_order', {
            order_id:{
                type: DataTypes.INTEGER,
                autoIncrement:true,
                primaryKey:true
            },
        client_name: {
            type: DataTypes.STRING,
            allowNull:false,
            validate: {
                notNull:{msg:'First Name is required'},
                customValidator(value){
                    if(value.trim() === '' || !value) {//TODO: ПРоверку на имени только на буквы (символов не должно быть)
                        throw new Error('First name is invalid')
                    }
                }
            }
        },
        client_surname: {
            type: DataTypes.STRING,
            allowNull:false,
            validate:{
                notNull:{msg:'Second Name is required'},
                customValidator(value) {
                    if (value.trim() === '' || !value) {//TODO: ПРоверку на имени только на буквы (символов не должно быть)
                        throw new Error('Second name is invalid')
                    }
                } }},
        client_phone:{
            type: DataTypes.STRING,
            allowNull:false,
            validate: {
                notNull:{msg:'Phone number  is required'},
                customValidator(value){
                    if (!validator.isMobilePhone(value)) {
                        throw new Error('Your phone number is invalid');
                    }
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                customValidator(value) {
                    if (!validator.isEmail(value)) {
                        throw new Error('Email is invalid')
                    }
                }
            }
        },
            status:{
                type:DataTypes.STRING,
                defaultValue:'Ожидание'
            },
            address:{
                type:DataTypes.STRING,
                allowNull:false,
                validate:{
                    notEmpty:{msg:'Address is required'}
                }
            },
        notes:{
                type:DataTypes.STRING,
            defaultValue: 'нет примечаний'
        },
        deliveredTime:{
                type:DataTypes.STRING,
            defaultValue:'не установлено'
        },
        paymentType:{
                type:DataTypes.STRING,
            defaultValue:'наличный'
        },
        },{
        hooks:{
          afterCreate: async function (model,options,cb) {
              {
                  console.log(chalk.green(model.order_id),chalk.bgBlackBright((options.dishes.length)),cb);
                 options.dishes.forEach(async (el,index)=>{
                     await  sequelize.models.Manager_menu.create({managerOrderOrderId: model.order_id, menuDishId: el.dish_id,dish_amount:el.dish_amount});
                 });
              }
          },
         async   afterBulkDestroy(instance, options) {
             console.log('AfterDestroy',instance.where.order_id);
          await  sequelize.models.Manager_menu.destroy({where:{managerOrderOrderId:instance.where.order_id}});
            }
        }
        }
    );
    manager_order.prototype.createDishes = function(id,dishes) {
        console.log('Find by creadentials works');
        dishes.forEach(async (order) => {
            await Manager_menu.create({managerOrderOrderId: id, menuDishId: order.dish_id,dish_amount:order.dish_amount});
        });

    };

    manager_order.associate = function (models) {
       // отношение 1 ко многим
        manager_order.belongsTo(models.user);
        manager_order.belongsTo(models.courier_order);
        manager_order.belongsTo(models.chef_order);

        manager_order.hasMany(models.report);

    };
    return manager_order;
};
