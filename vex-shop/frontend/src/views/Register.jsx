import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const { isAuth, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya está logueado, puede registrar desde aquí también
    if (isAuth) { setChecking(false); return; }

    // Verificar si es el primer setup (sin admins)
    api.setupStatus().then(r => r.json()).then(data => {
      if (data.hasAdmins && !isAuth) {
        // Ya hay admins y no está logueado → redirigir al login
        navigate('/login');
      } else {
        setIsFirstSetup(!data.hasAdmins);
        setChecking(false);
      }
    }).catch(() => setChecking(false));
  }, [isAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      // Si es primer setup usa endpoint público, si no usa el autenticado
      const res = isFirstSetup
        ? await api.registerPublic({ username: form.username, password: form.password })
        : await api.register({ username: form.username, password: form.password });

      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      if (isFirstSetup) {
        // Auto-login después del primer registro
        const loginRes = await api.login({ username: form.username, password: form.password });
        const loginData = await loginRes.json();
        if (loginRes.ok) { login(loginData.token, loginData.username); navigate('/'); return; }
      }

      navigate(isAuth ? '/admins' : '/login', {
        state: { success: `Usuario "${data.username}" creado correctamente` }
      });
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-page">
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">VEX SHOP</div>
        <div className="login-sub">
          {isFirstSetup ? 'Configuración inicial — Crea el primer administrador' : 'Registrar nuevo administrador'}
        </div>

        {isFirstSetup && (
          <div style={{
            background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, color: '#795548', marginBottom: 20,
          }}>
            👋 No hay administradores registrados. Crea el primero para comenzar.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>Usuario</label>
          <input
            className="login-input"
            placeholder="Nombre de usuario"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            autoComplete="username"
            required
          />

          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>Contraseña</label>
          <input
            className="login-input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
            required
          />

          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>Confirmar contraseña</label>
          <input
            className="login-input"
            type="password"
            placeholder="Repite la contraseña"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            autoComplete="new-password"
            required
          />

          {error && (
            <div style={{
              background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8,
              padding: '10px 14px', color: '#cc0000', fontSize: 13, marginBottom: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-vex" style={{ width: '100%', padding: 13, fontSize: 15 }} disabled={loading}>
            {loading ? 'Registrando...' : isFirstSetup ? 'Crear cuenta y entrar' : 'Registrar administrador'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px solid #f0f0f0' }}>
          {isAuth ? (
            <Link to="/admins" style={{ color: '#cc0000', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              ← Volver a Administradores
            </Link>
          ) : (
            <Link to="/login" style={{ color: '#cc0000', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              ← Ya tengo cuenta, iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
