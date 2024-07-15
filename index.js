require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');


const app = express();
const port = process.env.PORT || 3000

app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}); 

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.get('/api/users', (req, res) => {

    const query = 'SELECT * FROM users';

    db.query(query, (err, result) => {
        if (err) {
            throw err;
        }
        res.send(result);
    });
});

app.get('/api/items', (req,res) => {
    const query = 'SELECT * FROM items';

    db.query(query, (err, result) => {
        if (err) {
            throw err;
        }
        res.send(result);
    });
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});