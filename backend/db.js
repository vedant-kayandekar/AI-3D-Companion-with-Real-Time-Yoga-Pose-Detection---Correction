import { Pool as PgPool } from "pg";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const clientType = process.env.DB_CLIENT === "mysql" ? "mysql" : "pg";
let pgPool, mysqlPool;

if (clientType === "pg") {
  pgPool = new PgPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
} else {
  mysqlPool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
  });
}

const pool = {
  query: async (text, params) => {
    if (clientType === "mysql") {
      // 1. Convert Postgres `$1, $2` to MySQL `?, ?`
      let mysqlText = text.replace(/\$\d+/g, "?");
      
      // 2. Mock RETURNING logic (MySQL doesn't support RETURNING id natively in the query string)
      let isInsertReturning = false;
      let returningFields = [];
      const returningMatch = mysqlText.match(/RETURNING\s+(.*)$/i);
      
      if (returningMatch) {
        isInsertReturning = true;
        const returningStr = returningMatch[1];
        returningFields = returningStr.split(',').map(s => s.trim());
        // Remove RETURNING clause from the query since MySQL will throw a syntax error
        mysqlText = mysqlText.replace(/RETURNING\s+.*$/i, "");
      }

      // Execute MySQL query
      const [rows] = await mysqlPool.execute(mysqlText, params);

      // 3. Emulate Postgres response format for inserts
      if (isInsertReturning && rows.insertId) {
        const returnedRow = { id: rows.insertId };
        
        // If query was requesting `RETURNING id, username`, map username from params array
        if (returningFields.includes('username') && params && params.length >= 1) {
            returnedRow.username = params[0];
        }
        return { rows: [returnedRow] };
      }

      // 4. Emulate Postgres response format for standard SELECT/UPDATE
      return { rows: Array.isArray(rows) ? rows : [] };
    } else {
      // Native Postgres query
      return await pgPool.query(text, params);
    }
  },
};

export default pool;
