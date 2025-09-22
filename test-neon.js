const { neon } = require('@neondatabase/serverless');

async function testNeonConnection() {
  try {
    // Use the DATABASE_URL from environment variables
    const sql = neon(process.env.DB_DATABASE_URL || process.env.DATABASE_URL);
    
    console.log('🔗 Connecting to Neon database...');
    
    // Create comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('✅ Comments table created successfully!');
    
    // Test inserting a comment
    await sql`INSERT INTO comments (comment) VALUES ('Test comment from Node.js')`;
    console.log('✅ Test comment inserted!');
    
    // Query all comments
    const comments = await sql`SELECT * FROM comments ORDER BY created_at DESC LIMIT 5`;
    console.log('📝 Recent comments:', comments);
    
    console.log('🎉 Neon database connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testNeonConnection();