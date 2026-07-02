import { useState, useEffect, useCallback, FormEvent } from 'react';
import { api, Notice } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface NewNoticeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewNoticeModal({ onClose, onSuccess }: NewNoticeModalProps) {
  const [form, setForm] = useState({ title: '', content: '', isImportant: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.createNotice(form);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Post New Notice</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Notice title" required />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Notice content..." required rows={4} />
            </div>
            <div className="form-group" style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
              <input type="checkbox" id="important" checked={form.isImportant} onChange={e => setForm({...form, isImportant: e.target.checked})} style={{width:'auto'}} />
              <label htmlFor="important" style={{margin:0}}>📢 Mark as Important (pins to top and emails all residents)</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Posting…' : 'Post Notice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try { await api.deleteNotice(id); fetchNotices(); } catch (err: any) { alert(err.message); }
  };

  const important = notices.filter(n => n.isImportant);
  const regular = notices.filter(n => !n.isImportant);

  return (
    <>
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <h1>Notice Board</h1>
          <p style={{color: 'black'}}>Important announcements from the society admin</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Notice</button>
        )}
      </div>

      {loading ? <div className="loading" style={{minHeight:'200px'}}>Loading…</div> :
        notices.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📣</div>
            <p style={{color: 'black'}}>No notices posted yet.</p>
          </div>
        ) : (
          <>
            {important.length > 0 && (
              <>
                <h2 style={{fontSize:'1rem', fontWeight:'600', color:'#92400e', marginBottom:'.75rem', display:'flex', alignItems:'center', gap:'.5rem'}}>
                  📢 Important Notices
                </h2>
                <div className="notice-list" style={{marginBottom:'2rem'}}>
                  {important.map(n => (
                    <div key={n.id} className="notice-item important">
                      <div className="notice-title">
                        📢 {n.title}
                        <span className="badge badge-important">Important</span>
                      </div>
                      <div className="notice-content">{n.content}</div>
                      <div className="notice-footer">
                        <span>Posted by {n.admin?.name} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                        {user?.role === 'admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {regular.length > 0 && (
              <>
                {important.length > 0 && <h2 style={{fontSize:'1rem', fontWeight:'600', color:'#334155', marginBottom:'.75rem'}}>All Notices</h2>}
                <div className="notice-list">
                  {regular.map(n => (
                    <div key={n.id} className="notice-item">
                      <div className="notice-title">{n.title}</div>
                      <div className="notice-content">{n.content}</div>
                      <div className="notice-footer">
                        <span>Posted by {n.admin?.name} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                        {user?.role === 'admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )
      }

      {showModal && <NewNoticeModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchNotices(); }} />}
    </>
  );
}
