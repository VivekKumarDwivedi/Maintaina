import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { api } from '../utils/api';

const EDITABLE_STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Open: 'badge-open',
    'In Progress': 'badge-inprogress',
    Resolved: 'badge-resolved',
    Closed: 'badge-closed',
  };
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
  resident?: { name: string; flatNumber?: string };
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

interface UpdateModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSuccess: () => void;
}

interface HistoryModalProps {
  complaint: Complaint;
  onClose: () => void;
}

function UpdateModal({ complaint, onClose, onSuccess }: UpdateModalProps) {
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      if (status !== complaint.status) await api.updateStatus(complaint.id, { status, note });
      if (priority !== complaint.priority) await api.updatePriority(complaint.id, { priority, note });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isClosed = complaint.status === 'Closed';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Update Complaint #{complaint.id}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {isClosed && <div className="alert" style={{background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0'}}>This complaint is closed and cannot be updated.</div>}
          <p style={{fontWeight:600, marginBottom:'.5rem'}}>{complaint.title}</p>
          <p style={{fontSize:'.875rem', color:'#64748b', marginBottom:'1.25rem'}}>{complaint.description}</p>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} disabled={isClosed}>
              {EDITABLE_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} disabled={isClosed}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the resident..." disabled={isClosed} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {!isClosed && <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>}
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ complaint, onClose }: HistoryModalProps) {
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Complaint #{complaint.id} – Full History</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{fontWeight:600}}>{complaint.title}</p>
          <p style={{fontSize:'.875rem', color:'#64748b', margin:'.5rem 0 1rem'}}>{complaint.description}</p>
          {complaint.photoPath && <img src={`${API_BASE}${complaint.photoPath}`} alt="complaint" className="complaint-photo" style={{marginBottom:'1rem'}}/>}
          <div style={{fontSize:'.875rem', marginBottom:'1rem'}}>
            <strong>Resident:</strong> {complaint.resident?.name} ({complaint.resident?.flatNumber || 'N/A'})
          </div>
          <div className="history">
            {complaint.history?.map(h => (
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
                  {h.actor && <span className="history-actor">by {h.actor.name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [filters, setFilters] = useState({ category: '', status: '', priority: '', isOverdue: '', from: '', to: '' });
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [flagMsg, setFlagMsg] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const data = await api.getAllComplaints(params.toString());
      setComplaints((data as any).complaints || []);
      setTotal((data as any).total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, page]);

  const fetchDashboard = useCallback(async () => {
    try { const d = await api.getDashboard(); setDashboard(d); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { if (tab === 'complaints') fetchComplaints(); }, [fetchComplaints, tab]);
  useEffect(() => { if (tab === 'dashboard') fetchDashboard(); }, [fetchDashboard, tab]);

  const handleFlagOverdue = async () => {
    try {
      const r = await api.flagOverdue();
      setFlagMsg(r.message);
      fetchComplaints();
      setTimeout(() => setFlagMsg(''), 4000);
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateSuccess = () => { setSelected(null); fetchComplaints(); fetchDashboard(); };

  const setFilter = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [k]: e.target.value });
    setPage(1);
  };

  return (
    <>
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p style={{color: 'black'}}>Manage complaints, priorities, and notice board</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')} style={{color: 'black'}}>All Complaints</button>
        <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')} style={{color: 'black'}}>Dashboard</button>
      </div>

      {tab === 'complaints' && (
        <>
          <div className="filters">
            <select value={filters.category} onChange={setFilter('category')}>
              <option value="">All Categories</option>
              {['Plumbing','Electrical','Structural','Cleaning','Security','Lift','Parking','Other'].map((c: string) => <option key={c}>{c}</option>)}
            </select>
            <select value={filters.status} onChange={setFilter('status')}>
              <option value="">All Statuses</option>
              {['Open','In Progress','Resolved','Closed'].map((s: string) => <option key={s}>{s}</option>)}
            </select>
            <select value={filters.priority} onChange={setFilter('priority')}>
              <option value="">All Priorities</option>
              {['Low','Medium','High'].map((p: string) => <option key={p}>{p}</option>)}
            </select>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              From
              <input type="date" value={filters.from} onChange={setFilter('from')} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              To
              <input type="date" value={filters.to} onChange={setFilter('to')} />
            </label>
            <select value={filters.isOverdue} onChange={setFilter('isOverdue')}>
              <option value="">All</option>
              <option value="true">Overdue Only</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilters({ category:'', status:'', priority:'', isOverdue:'', from:'', to:'' }); setPage(1); }}>Clear</button>
            <button className="btn btn-danger btn-sm" onClick={handleFlagOverdue}>⚠ Flag Overdue</button>
          </div>
          {flagMsg && <div className="alert alert-success">{flagMsg}</div>}
          {loading ? <div className="loading" style={{minHeight:'200px'}}>Loading…</div> :
            complaints.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><p>No complaints match your filters.</p></div>
            ) : (
              <>
                <p style={{fontSize:'.875rem', color:'#64748b', marginBottom:'1rem'}}>{total} complaint{total !== 1 ? 's' : ''} found</p>
                <div className="complaint-list">
                  {complaints.map(c => (
                    <div key={c.id} className={`complaint-item ${c.isOverdue ? 'overdue' : ''}`}>
                      <div className="complaint-meta">
                        {statusBadge(c.status)}
                        {priorityBadge(c.priority)}
                        <span className="badge" style={{background:'#f1f5f9',color:'#475569'}}>{c.category}</span>
                        {c.isOverdue && <span className="badge badge-overdue">⚠ Overdue</span>}
                      </div>
                      <div className="complaint-title">#{c.id} – {c.title}</div>
                      <div className="complaint-desc">{c.description}</div>
                      <div className="complaint-footer">
                        <div>
                          <span style={{fontSize:'.875rem', color:'#64748b'}}>👤 {c.resident?.name} ({c.resident?.flatNumber || 'N/A'})</span>
                          <span className="complaint-date" style={{marginLeft:'1rem'}}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div style={{display:'flex', gap:'.5rem'}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setHistoryTarget(c)}>History</button>
                          <button className="btn btn-primary btn-sm" onClick={() => setSelected(c)}>Update</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {total > 15 && (
                  <div style={{display:'flex', justifyContent:'center', gap:'.75rem', marginTop:'1.5rem'}}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
                    <span style={{fontSize:'.875rem', color:'#64748b', alignSelf:'center'}}>Page {page}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p+1)} disabled={page * 15 >= total}>Next →</button>
                  </div>
                )}
              </>
            )
          }
        </>
      )}

      {tab === 'dashboard' && dashboard && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Complaints</div><div className="stat-value">{dashboard.total}</div></div>
            <div className="stat-card danger"><div className="stat-label">Overdue</div><div className="stat-value">{dashboard.overdueCount}</div></div>
            {dashboard.byStatus?.map((s: any) => (
              <div key={s.status} className={`stat-card ${s.status === 'Resolved' ? 'success' : s.status === 'Open' ? 'warning' : s.status === 'Closed' ? 'closed' : ''}`}>
                <div className="stat-label">{s.status}</div>
                <div className="stat-value">{s.count}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><h2>By Category</h2></div>
            <div className="card-body">
              <div style={{display:'flex', flexDirection:'column', gap:'.75rem'}}>
                {dashboard.byCategory?.map((cat: any) => (
                  <div key={cat.category} style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                    <div style={{width:'120px', fontSize:'.875rem', fontWeight:'500'}}>{cat.category}</div>
                    <div style={{flex:1, background:'#f1f5f9', borderRadius:'9999px', height:'8px', overflow:'hidden'}}>
                      <div style={{height:'100%', background:'#2563eb', width:`${Math.min(100, (cat.count / Math.max(1, dashboard.total)) * 100)}%`, borderRadius:'9999px'}} />
                    </div>
                    <div style={{width:'30px', textAlign:'right', fontSize:'.875rem', fontWeight:'600'}}>{cat.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {selected && <UpdateModal complaint={selected} onClose={() => setSelected(null)} onSuccess={handleUpdateSuccess} />}
      {historyTarget && <HistoryModal complaint={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </>
  );
}
