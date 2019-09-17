module.exports = (sequelize, DataTypes) => {

    const courier_order = sequelize.define('courier_order', {
        courier_order_id:{
                type: DataTypes.INTEGER,
                autoIncrement:true,
                primaryKey:true
            },
        }
    );
    courier_order.associate = function (models) {
        courier_order.hasMany(models.manager_order);
        // заказы могут выполнять разные повара
         // повар имеет множество заказов
        // поваров может быть много
        courier_order.belongsTo(models.user);
        courier_order.hasMany(models.report);

    };
    return courier_order;
};
