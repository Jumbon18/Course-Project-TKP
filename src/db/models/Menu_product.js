module.exports = (sequelize, DataTypes) => {
    const Menu_product = sequelize.define('Menu_product', {
        product_amount:{
            type:DataTypes.STRING,
            defaultValue:1
        }
    });
    return Menu_product;
};