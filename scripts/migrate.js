const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
  })

  const schema = fs.readFileSync(
    path.join(__dirname, '../supabase/schema.sql'),
    'utf8'
  )

  try {
    await client.connect()
    console.log('Connected to Supabase...')
    await client.query(schema)
    console.log('Schema applied successfully.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

migrate()
