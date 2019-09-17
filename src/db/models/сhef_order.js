module.exports = (sequelize, DataTypes) => {

    const chef_order = sequelize.define('chef_order', {
            chef_order_id:{
                type: DataTypes.INTEGER,
                autoIncrement:true,
                primaryKey:true
            },
        }
    );
    chef_order.associate = function (models) {
        chef_order.hasMany(models.manager_order);
        chef_order.hasMany(models.user);

        chef_order.hasMany(models.report);

    };
    return chef_order;
};
