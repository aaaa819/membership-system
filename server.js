const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register (General Member)
app.post('/api/register', async (req, res) => {
    const { username, password, name, phone, address } = req.body;
    const role = 'member';
    try {
        const result = await db.query(
            "INSERT INTO users (username, password, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [username, password, name, phone, address, role]
        );
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ success: false, message: "Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get Users (Admin Search/List)
app.get('/api/users', async (req, res) => {
    const search = req.query.search;
    let sql = "SELECT * FROM users WHERE role = 'member'";
    let params = [];

    if (search) {
        sql += " AND (name LIKE $1 OR username LIKE $2)";
        params.push(`%${search}%`, `%${search}%`);
    }

    try {
        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single User (for profile loading)
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: "User not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User (Member update self, Admin update member)
app.put('/api/users/:id', async (req, res) => {
    const { username, name, password, phone, address } = req.body;

    try {
        const result = await db.query(
            "UPDATE users SET username = $1, name = $2, password = $3, phone = $4, address = $5 WHERE id = $6",
            [username, name, password, phone, address, req.params.id]
        );
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try {
        const result = await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
