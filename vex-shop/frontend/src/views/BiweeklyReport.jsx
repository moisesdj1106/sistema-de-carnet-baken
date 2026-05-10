import { useState } from 'react';
import { api } from '../api';

function getBiweeklyDates() {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (day <= 15) {
    return {
      start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      end: `${year}-${String(month + 1).padStart(2, '0')}-15`,
    };
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    start: `${year}-${String(month + 1).padStart(2, '0')}-16`,
    end: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
  };
}

export default function BiweeklyReport() {
  const defaults = getBiweeklyDates();
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await api.getBiweekly(start, end);
    setData(await res.json());
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Reporte Quincenal</h2>

      <div className="vex-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Desde</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Hasta</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
        </div>
        <button className="btn-vex" onClick={load} disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? 'Cargando...' : 'Generar Reporte'}
        </button>
      </div>

      {data.length > 0 && (
        <div className="vex-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
          <table className="vex-table">
            <thead>
              <tr>
                <th>Trabajador</th><th>Puesto</th><th>Días Hábiles</th>
                <th>Días Trabajados</th><th>Faltas</th><th>Horas Totales</th><th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.map(w => (
                <>
                  <tr key={w.id}>
                    <td><strong>{w.full_name}</strong><br /><span style={{ fontSize: 11, color: '#888' }}>{w.cedula}</span></td>
                    <td>{w.position_name || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{w.business_days}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: w.worked_days >= w.business_days ? '#2e7d32' : '#c62828', fontWeight: 700 }}>
                        {w.worked_days}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: w.absent_days === 0 ? '#e8f5e9' : '#fce4e4',
                        color: w.absent_days === 0 ? '#2e7d32' : '#c62828',
                      }}>
                        {w.absent_days} {w.absent_days === 1 ? 'falta' : 'faltas'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {w.total_hours}h {w.total_minutes}m
                    </td>
                    <td>
                      <button onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                        style={{ background: '#f0f0f0', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {expanded === w.id ? '▲ Ocultar' : '▼ Ver días'}
                      </button>
                    </td>
                  </tr>
                  {expanded === w.id && (
                    <tr key={`${w.id}-detail`}>
                      <td colSpan={7} style={{ background: '#fafafa', padding: '12px 20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {Object.entries(w.daily_detail).map(([day, logs]) => {
                            const entries = logs.filter(l => l.event_type === 'entry');
                            const exits = logs.filter(l => l.event_type === 'exit');
                            return (
                              <div key={day} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', fontSize: 12, minWidth: 140 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{new Date(day + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                {entries.map((e, i) => (
                                  <div key={i} style={{ color: '#2e7d32' }}>
                                    ✅ {new Date(e.logged_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                    {exits[i] && <span style={{ color: '#c62828' }}> → 🚪 {new Date(exits[i].logged_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="vex-card" style={{ textAlign: 'center', color: '#aaa', padding: 48 }}>
          Selecciona un rango de fechas y genera el reporte
        </div>
      )}
    </div>
  );
}
