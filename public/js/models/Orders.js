export default class Order{
    constructor(id){

    }
    async getOrders(){
        try{
            const res = await $.get(`$admin/allOrders`);
            console.log(res);
        }catch (e) {
            console.log(e);
        }
    }
}