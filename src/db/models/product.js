module.exports = (sequelize,DataTypes)=>{
    const product = sequelize.define('product',{
        product_id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        product_name:{
            type:DataTypes.STRING,
            allowNull:false,
            validate: {
                notNull: {msg: 'Product Name is required'},
            }
        }},
    {
      hooks:{
          async afterBulkDestroy(instance, options)
          {
              console.log('After Destroy product', instance.where.product_id);
              await sequelize.models.Menu_product.destroy({where: {productProductId: instance.where.product_id}});

          }
      }
    });

    product.associate = function (models) {
        product.hasMany(models.menu);
    };
    return product;
};