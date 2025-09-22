import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DB_DATABASE_URL);
    
    const comments = await sql`
      SELECT * FROM comments 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    res.status(200).json({ 
      message: 'Comments retrieved successfully!', 
      comments 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Failed to get comments', 
      error: error.message 
    });
  }
}