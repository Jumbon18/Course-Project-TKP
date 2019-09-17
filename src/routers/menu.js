const express = require('express');
const router = new express.Router();
const chalk = require('chalk');
const {User, Manager_order, courier_order, chef_order,menu,product, report,Manager_menu,Menu_product} = require('../db/connection');
const{adminMenuAccess,ensureLoggedIn,asyncForEach,findAllInfoForSingle} = require('../../auth/middleware');


router.get('/',ensureLoggedIn,async(req,res,next)=>{
    console.log(chalk.bgGreen(req.user));
    const tokens = req.user.tokens;
    console.log(req.user);
    let isInclude = false;
    tokens.forEach((e) => {
        if (e.includes(req.token)) {
            return isInclude = true;
            return isInclude = true;
        }
    });
    if (isInclude) {
        try {
            if (req.user.position === 'повар' || req.user.position === 'админ') {

            const dishes = await menu.findAll();
                res.send(dishes);
            } else {
                res.status(404);
                console.log(chalk.bgGreen(req.user.position));
                next(new Error(`Limited access`));
            }
        } catch (e) {
            res.status(401);
            //TODO: сделать редирект
            next(new Error(`Un-authorized =) ${e}`));
        }
    }
});
router.post('/:id',ensureLoggedIn,adminMenuAccess,async (req,res,next)=>{
    try{

       const newProductInDish = await Menu_product.create({menuDishId:req.params.id,productProductId:req.body.product_id,product_amount:req.body.product_amount});

            await  Menu_product.create({menuDishId: newProductInDish.dish_id, productProductId: req.body.product_id,product_amount:req.body.product_amount});
       res.send(newProductInDish);
   } catch (e) {
       console.log(req.originalUrl);
        res.status(404);
       next(`Smth went wrong with reading singular dish instance ${e}`);
   }
});
router.post('/',ensureLoggedIn,adminMenuAccess,async (req,res,next)=>{
    const products = req.body.products;
    try {

            const newDish = await menu.create(req.body,{products});
            res.send(newDish);
    }catch (e) {
        res.status(401);
        next(new Error(`Un-authorized =) ${e}`));
    }
});
router.patch('/:id',adminMenuAccess,async(req,res,next)=>{
    const updates = Object.keys(req.body);
    const updatesAllow = ['dish_name','weight','description','dishPrice'];
    const isValidation = updates.every((update)=>updatesAllow.includes(update));
    try{
        const findDish = await menu.findOne({where:{dish_id:req.params.id}});
        if(findDish){
            if(req.body.product_amount){
                const MenuProductField = await  Menu_product.findOne({where:{menuDishId:req.params.id,productProductId:req.body.product_id}});
                if(MenuProductField){
                    MenuProductField.product_amount = req.body.product_amount;
                    await MenuProductField.save();
                    res.send(MenuProductField);
                }else{
                    res.status(404);
                    next(new Error('No such order in DB'));
                }
            }else{
                if(!isValidation){
                    res.status(404).send({error:'Invalid updates field'});
                }
                updates.forEach((update) => findDish[update] = req.body[update]);
                await findDish.save();
                res.send(findDish);
            }
        }
        else{
            res.status(404);
            next(new Error(`Dish doesnt exist`));
        }
    }catch (e) {

    }
});
router.delete('/:id',ensureLoggedIn,adminMenuAccess,async (req,res,next)=>{

   try{
        await menu.destroy({where:{dish_id:req.params.id}});

        res.send({msg:'successful'});

   } catch (e) {
       res.status(500);
       next(new Error(`Smth went wrong ${e}`));
   }
});
router.post('/products/create',ensureLoggedIn,adminMenuAccess,async(req,res,next)=>{
    try {
        const newProduct = await product.create(req.body);
        res.send(newProduct);
    } catch (e) {
        res.status(401);
        next(new Error(`Un-authorized =) ${e}`));
    }
});
router.post('/products/create/:id',ensureLoggedIn,adminMenuAccess,async (req,res,next)=>{
   try{
       const tokens = req.user.tokens;
       let isInclude = false;
       tokens.forEach((e) => {
           if (e.includes(req.token)) {
               return isInclude = true;
           }
       });
       if (isInclude) {
           const newOrder = await Menu_product.create({
               productProductId: req.params.id,
               menuDishId: req.body.dish_id,
               product_amount: req.body.product_amount
           });

           const result = await findAllInfoForSingle('courier', req.body.id);

           res.send(result);
       }
   }

       catch (e) {
               res.status(500);
               next(new Error(`${e}`));
           }

});
router.get('/products',ensureLoggedIn,adminMenuAccess,async(req,res,next)=>{
        try {
            const products = await product.findAll();
            res.send(products);
        } catch (e) {
            res.status(401);
            next(new Error(`Un-authorized =) ${e}`));
        }
});
router.patch('/products/:id',adminMenuAccess,async(req,res,next)=>{
    const updates = Object.keys(req.body);
    const updatesAllow = ['product_name'];
    const isValidation = updates.every((update)=>updatesAllow.includes(update));

    if(!isValidation){
        res.status(404).send({error:'Invalid updates field'});
    }
    try {
        const updateProduct = await product.findOne({where:{product_id:req.params.id}});
        updates.forEach((update)=>updateProduct[update] = req.body[update]);
        await updateProduct.save();
        if(!updateProduct){
            return res.status(400).send();
        }
        res.send(updateProduct);
    }catch (e) {
        res.status(401);
        next(new Error(`Un-authorized =) ${e}`));
    }
});
router.delete('/products/:id',adminMenuAccess,async(req,res,next)=>{
    try{
     const findDeletedProduct = await product.findOne({where:{product_id:req.params.id}});
     const findAllUsages = await Menu_product.findAll({where:{productProductId:req.params.id}});
   if(findDeletedProduct){
      // await Menu_product.destroy({where:{productProductId:req.params.id}});
       await product.destroy({where:{product_id:req.params.id}});
       res.send({findDeletedProduct,findAllUsages,msg:'Deleted successfully'});

   }
    }catch (e) {
        res.status(500);
        next(new Error(`Smth went wrong ${e}`));
    }
});
module.exports = router;