import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Admins() {
  const { username } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.getAdmins();
    setAdmins(await res.json());
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    const res = await api.register({ username: form.username, password: form.password });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setSuccess(`Admin "${data.username}" creado correctamente`);
    setForm({ username: '', password: '', confirm: '' });
    load();
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar al admin "${name}"?`)) return;
    await api.deleteAdmin(id);
    load();
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Administradores</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Formulario de registro */}
        <div className="vex-card">
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Registrar nuevo administrador</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 5 }}>Usuario</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Nombre de usuario"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 5 }}>Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 5 }}>Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repite la contraseña"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', color: '#cc0000', fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#f0fff4', border: '1px solid #b2dfdb', borderRadius: 8, padding: '10px 14px', color: '#2e7d32', fontSize: 13, marginBottom: 14 }}>✅ {success}</div>}
            <button className="btn-vex" style={{ width: '100%', padding: 12 }} disabled={loading}>
              {loading ? 'Registrando...' : '+ Crear Administrador'}
            </button>
          </form>
        </div>

        {/* Lista de admins */}
        <div className="vex-card">
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Administradores registrados</h3>
          {admins.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid #f0f0f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: a.username === username ? '#cc0000' : '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: a.username === username ? 'white' : '#555',
                  fontWeight: 700, fontSize: 16,
                }}>
                  {a.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {a.username}
                    {a.username === username && <span style={{ marginLeft: 8, fontSize: 11, background: '#cc0000', color: 'white', padding: '2px 8px', borderRadius: 20 }}>Tú</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>
                    Desde {new Date(a.created_at).toLocaleDateString('es-VE')}
                  </div>
                </div>
              </div>
              {a.username !== username && (
                <button onClick={() => handleDelete(a.id, a.username)} style={{
                  background: '#fff0f0', border: 'none', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer', color: '#cc0000', fontSize: 13,
                }}>
                  🗑️ Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
