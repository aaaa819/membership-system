const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, user: row });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

// Register (General Member)
app.post('/api/register', (req, res) => {
    const { username, password, name, phone, address } = req.body;
    const role = 'member';
    db.run("INSERT INTO users (username, password, name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)",
        [username, password, name, phone, address, role],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, message: "Username already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Get Users (Admin Search/List)
app.get('/api/users', (req, res) => {
    const search = req.query.search;
    let sql = "SELECT * FROM users WHERE role = 'member'";
    let params = [];

    if (search) {
        sql += " AND (name LIKE ? OR username LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Single User (for profile loading)
app.get('/api/users/:id', (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json(row);
        else res.status(404).json({ error: "User not found" });
    });
});

// Update User (Member update self, Admin update member)
app.put('/api/users/:id', (req, res) => {
    const { username, name, password, phone, address } = req.body;
    // Note: simplified update, doesn't check permissions strictly on backend for this demo, assumes frontend handles role checks or "self" checks mostly.
    // In a real app, we'd check req.session vs req.params.id.

    db.run("UPDATE users SET username = ?, name = ?, password = ?, phone = ?, address = ? WHERE id = ?",
        [username, name, password, phone, address, req.params.id],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, message: "Username already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
