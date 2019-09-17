const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
module.exports = (sequelize, DataTypes) => {


    const User = sequelize.define('user', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        password: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {msg: 'Please enter password'},
                customValidator(value) {
                    if (value.toLowerCase().includes('password')) {
                        throw new Error('Password cannot contain "password"')
                    }
                }
            }
        },
        firstName: {
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
        secondName: {
            type: DataTypes.STRING,
            allowNull:false,
            validate:{
                notNull:{msg:'Second Name is required'},
                customValidator(value) {
                    if (value.trim() === '' || !value) {//TODO: ПРоверку на имени только на буквы (символов не должно быть)
                        throw new Error('Second name is invalid')
                    }
                } }},
        phone:{
            type: DataTypes.STRING,
            allowNull:false,
            validate: {
                notNull:{msg:'Phone number  is required'},
                customValidator(value){
                    if(value.trim() === '' || !value) {//TODO: ПРоверку на имени только на буквы (символов не должно быть)
                        throw new Error('phone number  is invalid')
                    }
                }
            }
        }
        ,
        position: {
            type: DataTypes.STRING,
            defaultValue: 'user'
        },
        _id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        tokens: {
            type:DataTypes.ARRAY(DataTypes.STRING),
            allowNull :false,
            defaultValue:[],
            validate: {
                notNull: {msg: 'Token number  is required'}
            }
        }
    },{
        hooks:{
        async beforeCreate(instance, options) {
            instance.password = await  bcrypt.hash(instance.password, 8);}}
    }
    );
    User.findByCredentials =async function(email, password) {
        console.log('Find by creadentials works');
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('Unable to login')
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error('Unable to login')
        }

        return user
    };

    User.prototype.generateAuthToken = async function () {
        const user = this;
        console.log(user.tokens);
        const token = jwt.sign({_id:user.user_id},'thisismycode');
        user.tokens = user.tokens.concat({token});
        await user.save();
        return token;
};
    User.associate = function (models) {
        User.hasMany(models.manager_order);
        User.hasMany(models.chef_order);
        User.hasMany(models.courier_order);
    };
    return User;
};

