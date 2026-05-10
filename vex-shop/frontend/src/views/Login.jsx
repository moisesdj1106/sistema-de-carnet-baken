import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.login(form);
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al iniciar sesión');
      login(data.token, data.username);
      navigate('/');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">VEX SHOP</div>
        <div className="login-sub">Panel de Administración</div>
        <form onSubmit={handleSubmit}>
          <input
            className="login-input"
            placeholder="Usuario"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          {error && <div style={{ color: '#ff4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn-vex" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/register" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>
            ¿Sin cuenta? Registrarse
          </Link>
          <a href="/scan" style={{ color: '#cc0000', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            → Módulo de escaneo
          </a>
        </div>
      </div>
    </div>
  );
}
