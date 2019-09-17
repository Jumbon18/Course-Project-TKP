const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Manager_order } = require('../src/db/connection');
router.get('/',async(req,res)=>{
   res.render('auth');
});

function validateUser(user){
    const validEmail = typeof user.email === 'string' && user.email.trim() !=='';
    const validPassword = typeof user.password === 'string' && user.password.trim() !=='' && user.password.trim().length >= 6 ;
return validEmail && validPassword;
}

router.get('/signup',async (req,res)=>{
   res.render('registr')
});

router.post('/signup',async (req,res,next)=>{
    try{
        const user = await User.findOne({where: {email: req.body.email}});
        if (!user) {
        /*  const hash = await  bcrypt.hash(req.body.password, 8);
                req.body.password = hash;*/

                const newUser = await User.build(req.body);
                const token  = await newUser.generateAuthToken();
                res.status(201).send({message: '✔',newUser,token})
        } else {
            //send an error
            next(new Error('Email in use'));
        }

}catch (e) {
        console.log(e);
    res.status(500).send({e,error:'Server error'});
}


});
router.post('/login',async (req,res,next)=>{
  try {/*
      const findUser = await User.findOne({where: {email: req.body.user.email}});
      if(findUser) {
          const user = await User.findByCredentials(req.body.email, req.body.password);
          const token = await user.generateAuthToken();
          res.send({findUser, user, token});
      }*/
          const findUser = await User.findOne({where: {email: req.body.user.email}});

          if (findUser) {
                  const result = await bcrypt.compare(req.body.user.password, findUser.password);
                  if(result) {
                   const token = await findUser.generateAuthToken();
                      res.send({findUser, result,token});
                  }
              else{
                  res.status(404);
                      next(new Error('Invalid Login'));
              }
          } else {
res.status(404);
              next(new Error('Invalid password or email'))
          }
  }catch (e) {
      next(new Error(e));
  }
});

module.exports=router;