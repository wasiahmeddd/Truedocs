require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query("SELECT password FROM users WHERE username = 'wasiahemadchoudhary'", (err, res) => {
  if (err) throw err;
  if (res.rows.length > 0) {
    console.log("The hash is:", res.rows[0].password);
  } else {
    console.log("User not found.");
  }
  pool.end();
});
