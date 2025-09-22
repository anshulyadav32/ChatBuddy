import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { comment } = req.body;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const sql = neon(process.env.DB_DATABASE_URL);
    
    await sql`INSERT INTO comments (comment) VALUES (${comment})`;

    res.status(200).json({ message: 'Comment added successfully!' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Failed to add comment', 
      error: error.message 
    });
  }
}