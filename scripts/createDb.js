const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function createDatabase() {
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    
    // Read and execute the schema
    const schemaPath = path.join(__dirname, '..', 'DATABASE.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    
    // Export database to file
    const data = db.export();
    const outputPath = path.join(__dirname, '..', 'public', 'assets', 'fooddelivery.db');
    fs.writeFileSync(outputPath, data);
    console.log('Database created successfully at:', outputPath);
    
    db.close();
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

createDatabase();
