import { config } from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkPasswords() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const res = await pool.query("SELECT password FROM users WHERE username = 'wasiahemadchoudhary'");
    if (res.rows.length === 0) {
      console.log("User not found.");
      return;
    }

    const hash = res.rows[0].password;
    console.log("Retrieved hash from database.");
    console.log("========================================");
    console.log("PASSWORD HASH:", hash);
    console.log("========================================");

    const passwordsPath = path.join(__dirname, 'possible_passwords.txt');
    if (!fs.existsSync(passwordsPath)) {
      console.log("possible_passwords.txt not found.");
      return;
    }

    const content = fs.readFileSync(passwordsPath, 'utf8');
    const passwords = content.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 0);
    
    console.log(`Checking ${passwords.length} passwords from your file...`);

    let found = false;
    for (let i = 0; i < passwords.length; i++) {
        const match = await bcrypt.compare(passwords[i], hash);
        if (match) {
        // Obeying user strictly: don't store or show the password
        console.log(`\nSUCCESS! A match was found.`);
        console.log(`It is password number ${i + 1} (line ${i + 1}) in your possible_passwords.txt file.`);
        console.log(`I will NOT print or store the actual password as requested.`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log("\nNo match found in your provided list.");
      console.log("Since bcrypt is intentionally very slow (by design to prevent brute force), a full generic brute force attack through javascript would take thousands of years. I recommend trying to remember more possible combinations and adding them to the file.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

checkPasswords();
