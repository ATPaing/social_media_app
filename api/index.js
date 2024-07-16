require('dotenv').config();

const path = require('path');
const express = require('express');
const mysql = require('mysql2');

const argon2 = require('argon2');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/functions', express.static(path.join(__dirname, '../functions')));

const port = process.env.PORT ;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME  
});

db.connect(err => {
    if (err) {
        console.log(err);
    }
    console.log('Connected to database');
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/web_pages/index.html'));
})

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/web_pages/sign_up.html'));
})

app.post('/signup', async (req, res) => {

    const { username, password } = req.body;
    const query = `insert into users (username, password) values (?, ?)`;

    const hashed_pwd = await hashPassword(password);

    db.query(query, [username, hashed_pwd], async (err, result) => {
            
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Username already exists' });
            }
            console.log(err);
        }

        res.status(200).json({ message: 'User registered successfully' });
    })

})

app.get('/login', (req, res) => {
    res.redirect('/');
})

app.post('/login', (req, res) => {

    const { username, password } = req.body;

    const getPasswordQuery = 'SELECT id,password FROM users WHERE username = ?';

    db.query(getPasswordQuery, [username], async (err, result) => {

        if (err) {
            console.log(err);
        }

        if (result.length > 0) {

            const pwVerifyResut = await verifyPassword(result[0].password, password);

            if (pwVerifyResut) {

                const id = result[0].id;
                res.status(200).json({ message: 'Login successful', userId: id });

            } else {

                res.status(401).json({ message: 'Invalid username or password' });

            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    })

})

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/web_pages/user_feeds.html'));
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

async function hashPassword(password) {

    try {
        return await argon2.hash(password);
    } catch (err) {
        console.log(err);
    }

}

async function verifyPassword(hashedPassword, password) {

    try {
        return await argon2.verify(hashedPassword, password);
    } catch (err) {
        console.log(err);
    }

}
