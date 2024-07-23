require('dotenv').config();

const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const { Server } = require('socket.io'); 
const http = require('http');
const { faker } = require('@faker-js/faker');
const { format } = require('date-fns');

const argon2 = require('argon2');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use('/functions', express.static(path.join(__dirname, '../functions')));


const port = process.env.PORT ;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.log(err);
    }
    console.log('Connected to database');
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web_pages/index.html'));
})

app.post('/api/get_userIdByName', (req, res) => {
    const { name } = req.body;
    const query = `SELECT id FROM users WHERE username = ?`;

    db.query(query, [name], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(result[0]);
    });
});

app.post('/api/add_friend', (req, res) => {
    const { first_user_id, second_user_id } = req.body;
    const query = `INSERT INTO friends (first_user_id, second_user_id) VALUES (?, ?)`;

    db.query(query, [first_user_id, second_user_id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(200).json({ message: 'Friend added successfully' });
    });
});

app.post('/api/check_friend', async (req, res) => {
    const { first_user_id, second_user_id } = req.body;
    const query = 'SELECT COUNT(*) as count FROM friends WHERE first_user_id = ? AND second_user_id = ?'
    // Query to check if the friendship exists
    db.query(query, [first_user_id, second_user_id], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (result[0].count > 0) {
            res.status(200).json({ exists: true });
        } else {
            res.status(200).json({ exists: false });
        }
    });


});


app.get('/api/feeds', (req, res) => {
    const get_threads_with_usernames_query = `
        SELECT threads.id, threads.question, users.username as author, threads.likes, threads.replies_count, threads.is_solved, threads.created_at
        FROM threads
        JOIN users ON threads.author_id = users.id
    `;
    
    db.query(get_threads_with_usernames_query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Format the created_at date for each thread
        const formattedResult = result.map(thread => {
            return {
                ...thread,
                created_at: format(new Date(thread.created_at), 'dd MMMM, yyy hh:mma')
            };
        });


        res.status(200).json(formattedResult);
    });
});



app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../web_pages/sign_up.html'));
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
    res.sendFile(path.join(__dirname, '../web_pages/user_feeds.html'));
})

app.get('/feed', (req, res) => {

    res.sendFile(path.join(__dirname, '../web_pages/view_feed_by_id.html'));
})

app.get(`/api/threads/:id`, (req, res) => {
    const { id } = req.params;

    const query = `
    SELECT 
        threads.id AS thread_id,
        threads.question,
        threads.author_id,
        users.username AS askedBy,
        threads.created_at AS thread_created_at,
        threads.likes AS thread_likes,
        threads.replies_count,
        threads.is_solved,
        replies.id AS reply_id,
        replies.user_id AS reply_user_id,
        reply_users.username AS reply_author,
        replies.likes AS reply_likes,
        replies.content AS reply_content
        FROM 
            threads
        LEFT JOIN 
            users ON threads.author_id = users.id
        LEFT JOIN 
            replies ON threads.id = replies.thread_id
        LEFT JOIN 
            users AS reply_users ON replies.user_id = reply_users.id
        WHERE 
            threads.id = ?
        `;


    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Database query failed." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Thread not found." });
        }

        // Extract thread details from the first row
        const threads = {
            id: result[0].thread_id,
            question: result[0].question,
            author_id: result[0].author_id,
            askedBy: result[0].askedBy,
            created_at:  format(new Date( result[0].thread_created_at), 'dd MMMM, yyy hh:mma'),
            likes: result[0].thread_likes,
            replies_count: result[0].replies_count,
            is_solved: result[0].is_solved
        };


        // Extract replies
        const replies = result
            .filter(row => row.reply_id !== null)
            .map(row => ({
                id: row.reply_id,
                user_id: row.reply_user_id,
                author: row.reply_author,
                thread_id: row.thread_id,
                likes: row.reply_likes,
                content: row.reply_content,
                created_at: row.reply_created_at
            }));

        // Combine thread and replies in response
        const response = {
            threads,
            replies
        };

        res.status(200).json(response);
    });
});

app.post('/api/send_thread', (req,res) => {

    const { question, author_id, likes, replies_count, is_solved } = req.body;
    
    const insertThreadQuery = `insert into threads (question, author_id, likes, replies_count, is_solved) values (?, ?, ?, ?, ?)`;


    db.query(insertThreadQuery, [question, author_id, likes, replies_count, is_solved], (err, result) => {
        console.log(result)
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Thread created successfully',id: result.insertId });

    });
})

app.post('/api/thread_reply', (req, res) => {
    const { thread_id, user_id, content } = req.body;

    
    const insertReplyQuery = `INSERT INTO replies (thread_id, user_id, content) VALUES (?, ?, ?)`;
        const selectReplyQuery = `SELECT users.username AS author, replies.likes 
                                FROM replies
                                INNER JOIN users ON users.id = replies.user_id
                                WHERE replies.id = ?`;

    db.query(insertReplyQuery, [thread_id, user_id, content], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const reply_id = result.insertId;
        db.query(selectReplyQuery, [reply_id], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (rows.length > 0) {
                const author = rows[0].author;
                const likes = rows[0].likes;

                io.emit('new_thread_reply', { thread_id, user_id, content, likes, author });

                res.status(200).json(
                    {
                        message: 'Reply created successfully', 
                        data: {
                            thread_id,
                            user_id,
                            content,
                            likes,
                            author
                        }
                    });
            } else {
                res.status(404).json({ error: 'Reply not found' });
            }
        });
    });
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../web_pages/chat.html'));
})


app.get('/api/get_friends', (req, res) => {
    const query = `select users.username from users
                    join friends on users.id = friends.second_user_id 
                    where first_user_id = ?
                    `;
    const id = req.query.id;

    db.query(query,[id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(200).json(result);
    });
});

app.get('/api/get_all_users', (req, res) => {
    const query = `select username from users`;

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(200).json(result);
    });
});

app.get('/api/get_usernameById', (req, res) => {
    const { id } = req.query;
    const query = `SELECT username FROM users WHERE id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(result[0]);
    });
});

server.listen(port, () => {
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

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('new_thread', (data) => {
        console.log(data)
        const query = `
            SELECT users.username, threads.created_at 
            FROM users 
            JOIN threads 
            ON users.id = threads.author_id 
            WHERE users.id = ? AND threads.id = ?`;
        
        db.query(query, [data.author_id, data.id], (err, result) => {
    
            if (err) {
                console.log(err);
            }
            const newData = {
                ...data,
                author: result[0].username,
                created_at: format(new Date(result[0].created_at), 'dd MMMM, yyy hh:mma')
            }
            

            io.emit('update thread list', newData);
        })

        
    });

    socket.on('join-room', (room) => {
        console.log(room)
        socket.join(room);
    });

    socket.on('send_message', (data) => {
        console.log(`Sending message to room ${data.room}:`, data);
        const fullString = data.room;

        // Split the string by the hyphen
        const [firstUser, secondUser] = fullString.split('-');

        // Trim any extra whitespace if necessary
        const name1 = firstUser.trim();
        const name2 = secondUser.trim();
        console.log(`${name1}-${name2}`)
        console.log(`${name2}-${name1}`)
        io.to(`${name1}-${name2}`).to(`${name2}-${name1}`).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

