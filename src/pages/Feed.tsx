import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, createPost, likePost, repostPost, createComment } from '../services/api';
import '../styles/globals.css';

// TODO: Enhance Feed UI and implement post editing

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [commentContent, setCommentContent] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await getPosts();
      setPosts(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Gabim gjatë marrjes së postimeve.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      await createPost({ content: newPostContent });
      setNewPostContent('');
      fetchPosts();
    } catch (err) {
      alert('Gabim gjatë krijimit të postimit.');
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
      fetchPosts();
    } catch (err) {
      alert('Gabim gjatë like.');
    }
  };

  const handleRepost = async (postId: number) => {
    try {
      await repostPost(postId);
      fetchPosts();
    } catch (err) {
      alert('Gabim gjatë repost.');
    }
  };

  const handleComment = async (e: React.FormEvent, postId: number) => {
    e.preventDefault();
    const content = commentContent[postId];
    if (!content || !content.trim()) return;

    try {
      await createComment(postId, { content });
      setCommentContent({ ...commentContent, [postId]: '' });
      fetchPosts();
    } catch (err) {
      alert('Gabim gjatë shtimit të komentit.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-color)', margin: 0 }}>Feed</h1>
        <button onClick={logout} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Dalje</button>
      </div>

      <div className="mastodon-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={handleCreatePost}>
          <div className="input-group">
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Çfarë po mendoni?"
              rows={3}
              style={{ width: '100%', resize: 'none' }}
              required 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
              Publiko
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Duke ngarkuar...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.length === 0 && (
            <div className="mastodon-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nuk ka asnjë postim. Bëhu i pari që poston diçka!
            </div>
          )}
          
          {posts.map(post => (
            <div key={post.id} className="mastodon-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  User ID: {post.author_id}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(post.created_at).toLocaleString('sq')}
                </span>
              </div>
              
              <div style={{ margin: '1rem 0', fontSize: '1.1rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', margin: '1rem 0' }}>
                <button onClick={() => handleLike(post.id)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                  ♥ {post.likes?.length || 0}
                </button>
                <button onClick={() => handleRepost(post.id)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                  ↻ {post.reposts?.length || 0}
                </button>
              </div>

              {/* Komentet */}
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Komentet ({post.comments?.length || 0})</h4>
                
                {post.comments?.map((comment: any) => (
                  <div key={comment.id} style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: '#888' }}>User {comment.author_id}:</span>
                    <span>{comment.content}</span>
                  </div>
                ))}

                <form onSubmit={(e) => handleComment(e, post.id)} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    value={commentContent[post.id] || ''}
                    onChange={(e) => setCommentContent({ ...commentContent, [post.id]: e.target.value })}
                    placeholder="Shkruaj një koment..." 
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Koment</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;