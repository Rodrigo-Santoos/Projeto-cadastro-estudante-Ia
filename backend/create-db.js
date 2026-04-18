const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({ user: 'root', host: 'localhost', password: 'root' });
    await conn.query('CREATE DATABASE IF NOT EXISTS ciee_cadastro');
    console.log('Database created or already exists');
    await conn.end();
  } catch (e) {
    console.error('Error creating database. Please ensure MySQL is running on localhost (root/no password) and try again.', e.message);
  }
}
run();
