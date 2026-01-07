const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
  try {
    const client = await pool.connect();
    try {
      // Create Users table
      await client.query(`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role TEXT NOT NULL DEFAULT 'member'
      )`);

      // Seed Data
      const res = await client.query("SELECT count(*) as count FROM users");
      const count = parseInt(res.rows[0].count);

      if (count === 0) {
        console.log("Seeding database...");

        // 1 Admin
        await client.query(
          "INSERT INTO users (username, password, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6)",
          ["admin", "admin", "Administrator", "000-000-0000", "Admin HQ", "admin"]
        );

        // 10 General Members
        for (let i = 1; i <= 10; i++) {
          await client.query(
            "INSERT INTO users (username, password, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              `user${i}`,
              `password${i}`,
              `Member ${i}`,
              `555-010-${i.toString().padStart(2, '0')}`,
              `123 Member St, Apt ${i}`,
              "member"
            ]
          );
        }

        console.log("Database seeded with 1 admin and 10 members.");
      } else {
        console.log("Database already contains data, skipping seed.");
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};

// Initialize DB on start
initDb();

module.exports = {
  query: (text, params) => pool.query(text, params)
};
