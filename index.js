const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'abc@123',
    database: 'user_list'
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