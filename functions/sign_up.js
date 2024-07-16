const username = document.getElementById('username');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm_password');
const res_message = document.getElementById('res-message');
const sign_up_form = document.getElementById('sign_up_form');

username.value = '';
password.value = '';
confirmPassword.value = '';

sign_up_form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const username_value = username.value;
    const password_value = password.value;
    const confirmPwd_value = confirmPassword.value;

    if(username_value === '' || password_value === '' || confirmPwd_value === '') {
        res_message.textContent = 'All fields are required';
        return;
    }

    if (password_value !== confirmPwd_value) {
        password.value = '';
        confirmPassword.value = '';
        res_message.textContent = 'Passwords do not match';
        return;
    }

    const formData = new URLSearchParams();
    formData.append('username', username_value);
    formData.append('password', password_value);

    const res = await fetch('/signup', {
        method: 'POST',
        body: formData.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

    const data = await res.json();

    if (res.ok) {
        
        window.location.href = "/login"

    } else {

        res_message.textContent = `**${data.message}`;

        username.value = '';
        password.value = '';
        confirmPassword.value = '';
    }

})

sign_up_form.addEventListener('input', () => {
    res_message.textContent = '';
});