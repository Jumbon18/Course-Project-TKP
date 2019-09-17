const state={};

const controlOrdes = async ()=>{
  state.orders = new Order();
  try {
      await state.orders.getOrders();
  }catch (e) {
      console.log(e);
  }
};