import { useState } from 'react';
import { neon } from '@neondatabase/serverless';

export default function TestDB() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState('');

  const createTable = async () => {
    try {
      setStatus('Creating table...');
      const response = await fetch('/api/create-table', { method: 'POST' });
      const result = await response.json();
      setStatus(result.message);
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setStatus('Adding comment...');
      const response = await fetch('/api/add-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment })
      });
      const result = await response.json();
      setStatus(result.message);
      setNewComment('');
      loadComments();
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  const loadComments = async () => {
    try {
      setStatus('Loading comments...');
      const response = await fetch('/api/get-comments');
      const result = await response.json();
      setComments(result.comments || []);
      setStatus('Comments loaded successfully');
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Neon Database Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={createTable} style={{ marginRight: '10px', padding: '10px' }}>
          Create Comments Table
        </button>
        <button onClick={loadComments} style={{ padding: '10px' }}>
          Load Comments
        </button>
      </div>

      <form onSubmit={addComment} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment"
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '10px' }}>
          Add Comment
        </button>
      </form>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        Status: {status}
      </div>

      <div>
        <h3>Comments:</h3>
        {comments.length === 0 ? (
          <p>No comments yet</p>
        ) : (
          <ul>
            {comments.map((comment, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                <strong>{comment.comment}</strong>
                <br />
                <small>{new Date(comment.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}