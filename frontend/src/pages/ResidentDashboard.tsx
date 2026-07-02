import { useState, useEffect, useCallback, FormEvent } from 'react';
import { api } from '../utils/api';

const CATEGORIES = ['Plumbing', 'Electrical', 'Structural', 'Cleaning', 'Security', 'Lift', 'Parking', 'Other'];

const statusBadge = (s: string) => {
  const map: Record<string, string> = { Open: 'badge-open', 'In Progress': 'badge-inprogress', Resolved: 'badge-resolved', Closed: 'badge-closed' };
  return <span className={`badge ${map[s] || ''}`}>{s}</span>;
};

const priorityBadge = (p: string) => {
  const map: Record<string, string> = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' };
  return <span className={`badge ${map[p] || ''}`}>{p}</span>;
};

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  photoPath?: string;
  isOverdue?: boolean;
  history?: HistoryItem[];
}

interface HistoryItem {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  fromPriority?: string;
  toPriority?: string;
  note?: string;
  createdAt: string;
  actor?: { name: string; role: string };
}

interface NewComplaintModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewComplaintModal({ onClose, onSuccess }: NewComplaintModalProps) {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.category) return setError('Please select a category');
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      if (photo) fd.append('photo', photo);
      await api.createComplaint(fd);
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
          <h3>Raise New Complaint</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Brief description of the issue" required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the issue in detail..." required />
            </div>
            <div className="form-group">
              <label>Photo (optional)</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
              <p className="form-hint">Max 5MB. JPG, PNG, GIF, WebP</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting…' : 'Submit Complaint'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ComplaintCardProps {
  complaint: Complaint;
}

function ComplaintCard({ complaint }: ComplaintCardProps) {
  const [expanded, setExpanded] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  return (
    <div className={`complaint-item ${complaint.isOverdue ? 'overdue' : ''}`}>
      <div className="complaint-meta">
        {statusBadge(complaint.status)}
        {priorityBadge(complaint.priority)}
        <span className="badge" style={{background:'#f1f5f9',color:'#475569'}}>{complaint.category}</span>
        {complaint.isOverdue && <span className="badge badge-overdue">⚠ Overdue</span>}
      </div>
      <div className="complaint-title">#{complaint.id} – {complaint.title}</div>
      <div className="complaint-desc">{complaint.description}</div>
      {complaint.photoPath && <img src={`${API_BASE}${complaint.photoPath}`} alt="complaint" className="complaint-photo" />}
      <div className="complaint-footer">
        <span className="complaint-date">{new Date(complaint.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
        {complaint.history?.length && (
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Hide history' : `View history (${complaint.history.length})`}
          </button>
        )}
      </div>
      {expanded && complaint.history && complaint.history.length > 0 && (
        <div style={{marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'.875rem', fontWeight:'600', marginBottom:'.75rem', color:'#64748b'}}>Status History</p>
          <div className="history">
            {complaint.history.map(h => (
              <div key={h.id} className="history-item">
                <div className="history-action">
                  {h.action === 'created' && '📋 Complaint submitted'}
                  {h.action === 'status_changed' && `🔄 Status: ${h.fromStatus} → ${h.toStatus}`}
                  {h.action === 'priority_changed' && `🏷 Priority: ${h.fromPriority} → ${h.toPriority}`}
                  {h.action === 'flagged_overdue' && '⚠ Flagged as overdue'}
                </div>
                {h.note && <div className="history-note">💬 {h.note}</div>}
                <div style={{display:'flex', gap:'1rem', marginTop:'.25rem'}}>
                  <span className="history-time">{new Date(h.createdAt).toLocaleString('en-IN')}</span>
                  {h.actor && <span className="history-actor">by {h.actor.name} ({h.actor.role})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResidentDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleSuccess = () => { setShowModal(false); fetchComplaints(); };

  const open = complaints.filter(c => c.status === 'Open').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const closed = complaints.filter(c => c.status === 'Closed').length;

  return (
    <>
      <div className="page-header">
        <h1>My Complaints</h1>
        <p style={{color: 'black'}}>Track all your maintenance requests</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{complaints.length}</div></div>
        <div className="stat-card warning"><div className="stat-label">Open</div><div className="stat-value">{open}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value">{inProgress}</div></div>
        <div className="stat-card success"><div className="stat-label">Resolved</div><div className="stat-value">{resolved}</div></div>
        <div className="stat-card closed"><div className="stat-label">Closed</div><div className="stat-value">{closed}</div></div>
      </div>

      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem'}}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Raise Complaint</button>
      </div>

      {loading ? <div className="loading" style={{minHeight:'200px'}}>Loading…</div> :
        complaints.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p style={{color: 'black'}}>No complaints yet. Raise your first complaint when you face an issue.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Raise Complaint</button>
          </div>
        ) : (
          <div className="complaint-list">
            {complaints.map(c => <ComplaintCard key={c.id} complaint={c} />)}
          </div>
        )
      }

      {showModal && <NewComplaintModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </>
  );
}
