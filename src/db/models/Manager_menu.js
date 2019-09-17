module.exports = (sequelize, DataTypes) => {
    const Manager_menu = sequelize.define('Manager_menu', {
        dish_amount:{
            type:DataTypes.INTEGER,
            defaultValue:1
        }
    });
    return Manager_menu;
};