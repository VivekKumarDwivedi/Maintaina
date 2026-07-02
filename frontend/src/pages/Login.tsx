import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/resident');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">🏢</div>
        <h1>
  <strong>Maintaina</strong> - A Society Maintenance Tracker
        </h1>
        <p className="subtitle">Sign in to your account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Xyz@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="********" required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{marginTop:'1.25rem', textAlign:'center', fontSize:'.875rem', color:'#64748b'}}>
          No account? <Link to="/register" style={{color:'#2563eb'}}>Register here</Link>
        </p>
        <div style={{marginTop:'1rem', padding:'.75rem', background:'#f1f1f9', borderRadius:'6px', fontSize:'.8125rem', color:'#64748b'}}>
          <strong>Demo admin:</strong> admin@society.com / admin123
        </div>
      </div>
    </div>
  );
}
