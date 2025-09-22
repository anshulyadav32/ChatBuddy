import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DB_DATABASE_URL);
    
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    res.status(200).json({ message: 'Comments table created successfully!' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Failed to create table', 
      error: error.message 
    });
  }
}