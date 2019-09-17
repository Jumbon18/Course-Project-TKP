$.ajaxSetup({// Now when Jquery make request it allow cookies to be set on the client side
    crossDomain: true,
    xhrFields: {
        withCredentials: true
    }
});

const API_URL = getHostURL();
const AUTH_URL = `${API_URL}/auth`;
function getHostURL() {
    if (window.location.host.indexOf('localhost') !== -1) {
        return 'http://localhost:3000'
    } else {
        return 'Development'
    }
}

function getUserFromForm() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = {
        email,
        password
    };
    return user;
}
function getUserFromSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const firstName= document.getElementById('first').value;
    const secondName = document.getElementById('second').value;
    const phone = document.getElementById('phone').value;
    const user = {
        email,
        password,
        secondName,
        firstName,
        phone
    };
    return user
}
function errorHandler(message) {
    const error = document.getElementById('errorMessage');
    error.innerText =message;
    error.classList.add('show');
}