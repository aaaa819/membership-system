const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./membership.db');

db.serialize(() => {
  // Create Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT NOT NULL DEFAULT 'member' -- 'admin' or 'member'
  )`);

  // Seed Data
  db.get("SELECT count(*) as count FROM users", (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding database...");
      const stmt = db.prepare("INSERT INTO users (username, password, name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)");

      // 1 Admin
      stmt.run("admin", "admin", "Administrator", "000-000-0000", "Admin HQ", "admin");

      // 10 General Members
      for (let i = 1; i <= 10; i++) {
        stmt.run(
          `user${i}`,
          `password${i}`,
          `Member ${i}`,
          `555-010-${i.toString().padStart(2, '0')}`,
          `123 Member St, Apt ${i}`,
          "member"
        );
      }

      stmt.finalize();
      console.log("Database seeded with 1 admin and 10 members.");
    } else {
      console.log("Database already contains data, skipping seed.");
    }
  });
});

module.exports = db;
