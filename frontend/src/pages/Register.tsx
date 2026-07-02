import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', flatNumber: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role: 'resident' });
      navigate('/resident');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">🏢</div>
        <h1>Create Account</h1>
        <p className="subtitle">Register as a resident</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Flat Number</label>
              <input value={form.flatNumber} onChange={set('flatNumber')} placeholder="A-404" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="9876543210" />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p style={{marginTop:'1.25rem', textAlign:'center', fontSize:'.875rem', color:'#64748b'}}>
          Already have an account? <Link to="/login" style={{color:'#2563eb'}}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
