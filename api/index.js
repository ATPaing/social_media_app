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

app.post('/login', (req, res) => {

    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, result) => {

        if (err) {
            console.log(err);
        }

        if (result.length > 0) {
            res.status(200).json({ userId: result[0].id }); 
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