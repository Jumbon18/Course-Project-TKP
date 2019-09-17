module.exports = {
    entry:{
        admin:'./public/js/user.js',
        auth:'./public/js/login.js'
    },
    output:{
      path:__dirname + '/dist',
      filename:"[name].bundle.js"
    }
};