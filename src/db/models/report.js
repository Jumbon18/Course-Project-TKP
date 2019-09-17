module.exports = (sequelize, DataTypes) => {

    const report = sequelize.define('report', {
            report_id:{
                type: DataTypes.INTEGER,
                autoIncrement:true,
                primaryKey:true
            },
        url:{type:DataTypes.STRING,
        defaultValue:'none'}
        }
    );
    report.associate = function (models) {
        report.belongsTo(models.manager_order);
        report.belongsTo(models.chef_order);
        report.belongsTo(models.courier_order);

    };
    return report;
};
