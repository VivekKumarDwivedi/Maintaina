import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [resetForm, setResetForm] = useState({ email: '', token: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(form.email);
      setSuccess(res.message);
      setResetForm((prev) => ({ ...prev, email: form.email }));
      setMode('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.resetPassword(resetForm);
      setSuccess(res.message);
      setForm((prev) => ({ ...prev, email: resetForm.email }));
      setMode('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="auth-card">
        <div className="logo">🏢</div>
        
        {mode === 'login' && (
          <>
            <h1>Maintaina</h1>
            <p className="subtitle">Society Maintenance Tracker</p>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder="name@example.com" 
                  required 
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.375rem' }}>
                  <label style={{ margin: 0 }}>Password</label>
                  <button 
                    type="button" 
                    className="link-btn" 
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            
            <p style={{marginTop:'1.25rem', textAlign:'center', fontSize:'.875rem', color:'#64748b'}}>
              No account? <Link to="/register" style={{color:'#2563eb', fontWeight: 600}}>Register here</Link>
            </p>
            
            <div style={{marginTop:'1.25rem', padding:'.75rem', background:'rgba(37,99,235,.06)', border:'1px solid rgba(37,99,235,.15)', borderRadius:'8px', fontSize:'.8125rem', color:'#1e40af'}}>
              <strong>Demo admin:</strong> admin@society.com / admin123
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h1>Reset Password</h1>
            <p className="subtitle">Enter your email to receive a verification code</p>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <form onSubmit={handleForgotSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder="name@example.com" 
                  required 
                />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Sending code…' : 'Send Reset Code'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-full" 
                style={{ marginTop: '.75rem' }} 
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                disabled={loading}
              >
                Back to Login
              </button>
            </form>
          </>
        )}

        {mode === 'reset' && (
          <>
            <h1>Create New Password</h1>
            <p className="subtitle">Enter the 6-digit code sent to your email</p>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={resetForm.email} 
                  onChange={e => setResetForm({...resetForm, email: e.target.value})} 
                  placeholder="name@example.com" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <input 
                  type="text" 
                  value={resetForm.token} 
                  onChange={e => setResetForm({...resetForm, token: e.target.value})} 
                  placeholder="123456" 
                  maxLength={6} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={resetForm.newPassword} 
                  onChange={e => setResetForm({...resetForm, newPassword: e.target.value})} 
                  placeholder="Min 6 characters" 
                  minLength={6} 
                  required 
                />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Resetting password…' : 'Reset Password'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-full" 
                style={{ marginTop: '.75rem' }} 
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                disabled={loading}
              >
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
