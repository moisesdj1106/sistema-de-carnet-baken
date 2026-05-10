import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AttendanceToday() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const res = await api.getToday();
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await api.deleteLog(id);
    load();
  };

  const filtered = filter === 'all' ? logs : logs.filter(l => l.event_type === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
          Asistencia de Hoy<br />
          <span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}>
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['all','Todos'],['entry','Entradas'],['exit','Salidas']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: filter === v ? '#cc0000' : '#f0f0f0',
              color: filter === v ? 'white' : '#333',
            }}>{l}</button>
          ))}
          <button onClick={load} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 13 }}>🔄</button>
        </div>
      </div>

      <div className="vex-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
        <table className="vex-table">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Puesto</th>
              <th>Tipo</th>
              <th>Hora</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {l.photo_url
                      ? <img src={l.photo_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    }
                    <strong>{l.full_name}</strong>
                  </div>
                </td>
                <td>{l.position_name || '-'}</td>
                <td>
                  <span className={l.event_type === 'entry' ? 'badge-entry' : 'badge-exit'}>
                    {l.event_type === 'entry' ? '✅ Entrada' : '🚪 Salida'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {new Date(l.logged_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(l.id)}
                    title="Eliminar registro"
                    style={{ background: '#fff0f0', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#cc0000', fontSize: 13 }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>Sin registros por ahora</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
