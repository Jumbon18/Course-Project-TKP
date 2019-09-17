const form = document.querySelector('.auth-form');
$(()=>{
    form.addEventListener('submit',(e)=>{
        e.preventDefault();
    const user = getUserFromForm();

        login(user)
            .then(result=>{
                console.log(result);
                window.location = `/admin`
       }).catch(e=>{
            console.log(e);
         errorHandler(e.responseJSON.message);
        });
    });
    function login(user) {
        return $.post(`${AUTH_URL}/login`,user);

    }
});
