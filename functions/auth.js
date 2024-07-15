const loginForm = document.getElementById('login_form');
const username = document.getElementById('username');
const password = document.getElementById('password');

const resMessage = document.getElementById('res-message');

username.value = '';
password.value = '';
localStorage.clear();

loginForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const username_value = username.value;
    const password_value = password.value;

    const formData = new URLSearchParams();
    formData.append('username', username_value);
    formData.append('password', password_value);

    const response = await fetch('/login', {
        method: 'POST',
        body: formData.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const data = await response.json();

    if (response.ok) {
        
        const userId = data.userId
        localStorage.setItem('userId', userId);
        window.location.href = '/home';

    } else {

        resMessage.textContent = `**${data.message}`;

    }
    

    username.value = '';
    password.value = '';


});

loginForm.addEventListener('input', () => {
    resMessage.textContent = ``;
});