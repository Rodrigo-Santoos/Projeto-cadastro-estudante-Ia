const mysql = require('mysql2/promise');
async function test() {
  console.log("Testing localhost...");
  try {
    const connLocal = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root' });
    console.log("Connected using localhost!");
  } catch(e) {
    console.error("Localhost failed:", e.message);
  }

  console.log("Testing 127.0.0.1...");
  try {
    const connIP = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'root' });
    console.log("Connected using 127.0.0.1!");
    await connIP.query('CREATE DATABASE IF NOT EXISTS ciee_cadastro');
    console.log("Database ciee_cadastro created/verified.");
  } catch(e) {
    console.error("127.0.0.1 failed:", e.message);
  }
}
test();
