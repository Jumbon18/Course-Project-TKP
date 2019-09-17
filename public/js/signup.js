$(()=>{
    $(()=>{
        $('#phone').mask("+380(99) 999-99-99");
    });
   console.log('ready with jquery');
   const form = document.querySelector(".auth-form");
   form.addEventListener('submit',(e)=>{
       e.preventDefault();
    const user = getUserFromSignUp();

        signup(user).then(result=>{
            console.log(result);
            window.location = '/admin';
        }).catch(e=>{
console.log(e);
errorHandler(e);
       })
   })
});

function signup(user) {
    return $.post(`${AUTH_URL}/signup`,user);
}