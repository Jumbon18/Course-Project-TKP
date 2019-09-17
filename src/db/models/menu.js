
module.exports = (sequelize,DataTypes)=>{
const menu = sequelize.define('menu',{
    dish_id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    dish_name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,
        validate: {
            notNull: {msg: 'Dish Name is required'},
        }
    },
    weight:{
        type:DataTypes.STRING,
        defaultValue: 0
    },
    description:{
        type:DataTypes.STRING,
        defaultValue:'None'
    },
    dishPrice:{
        type:DataTypes.INTEGER,
        allowNull:false,
        validate:{
            notEmpty:{msg:'Price is required'},
        }
    }

},{
    hooks:{
        async afterBulkDestroy(instance, options)
        {
            console.log('After Destroy product', instance.where.dish_id);
            await sequelize.models.Menu_product.destroy({where: {menuDishId: instance.where.dish_id}});
            await sequelize.models.Manager_menu.destroy({where:{menuDishId:instance.where.dish_id}});

        },
       /* afterCreate: async function (model,options,cb) {
            {
                options.products.forEach(async (el,index)=>{
                    await  sequelize.models.Menu_product.create({menuDishId: model.dish_id, productProductId: el.product_id,product_amount:el.product_amount});
                });
            }
        },*/
    }
});
    menu.associate = function (models) {
        menu.hasMany(models.manager_order);
        menu.belongsTo(models.product);
    };
return menu;
};
