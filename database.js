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

        // 10 Specific General Members
        const members = [
          { username: 'linyu_0823', name: '林冠宇', pass: '3280_uynil', phone: '0912-345-678', addr: '台北市中山區南京東路三段 120 號' },
          { username: 'yijun_chen', name: '陳怡君', pass: 'nehc_nujiy', phone: '0923-456-789', addr: '新北市板橋區文化路一段 88 號' },
          { username: 'boxiang_w', name: '王柏翔', pass: 'w_gnaixob', phone: '0987-654-321', addr: '桃園市中壢區中正路 215 號' },
          { username: 'yating_zhang', name: '張雅婷', pass: 'gnahz_gnitay', phone: '0905-321-456', addr: '台中市西屯區福星路 99 號' },
          { username: 'hanli_0412', name: '李承翰', pass: '2140_ilnah', phone: '0918-222-333', addr: '台南市東區崇善路 168 號' },
          { username: 'siying_h', name: '黃思穎', pass: 'h_gniyis', phone: '0976-888-999', addr: '高雄市左營區博愛三路 45 號' },
          { username: 'junhao_wu', name: '吳俊豪', pass: 'uw_oahnuj', phone: '0933-777-555', addr: '新竹市東區光復路二段 101 號' },
          { username: 'xinyu_zhao', name: '趙心妤', pass: 'oahz_uynix', phone: '0909-111-222', addr: '苗栗縣頭份市中華路 50 號' },
          { username: 'zonghan_tsai', name: '蔡宗翰', pass: 'iast_nahgnoz', phone: '0928-444-666', addr: '彰化縣彰化市中山路二段 300 號' },
          { username: 'peishan_cheng', name: '鄭佩珊', pass: 'gnehc_nahsiep', phone: '0966-555-888', addr: '嘉義市西區民生南路 72 號' }
        ];

        for (const m of members) {
          await client.query(
            "INSERT INTO users (username, password, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6)",
            [m.username, m.pass, m.name, m.phone, m.addr, "member"]
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
