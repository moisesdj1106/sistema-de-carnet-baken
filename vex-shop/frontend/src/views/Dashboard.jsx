import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, cards: 0, todayEntries: 0, todayExits: 0 });

  useEffect(() => {
    Promise.all([api.getWorkers(), api.getCards(), api.getToday()]).then(async ([wRes, cRes, aRes]) => {
      const workers = await wRes.json();
      const cards = await cRes.json();
      const today = await aRes.json();
      setStats({
        workers: workers.length || 0,
        cards: cards.filter(c => c.is_active).length || 0,
        todayEntries: today.filter(l => l.event_type === 'entry').length || 0,
        todayExits: today.filter(l => l.event_type === 'exit').length || 0,
      });
    });
  }, []);

  const cards = [
    { icon: '👥', label: 'Trabajadores', value: stats.workers, color: '#cc0000' },
    { icon: '🪪', label: 'Carnets Activos', value: stats.cards, color: '#111' },
    { icon: '✅', label: 'Entradas Hoy', value: stats.todayEntries, color: '#28a745' },
    { icon: '🚪', label: 'Salidas Hoy', value: stats.todayExits, color: '#dc3545' },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{ background: c.color + '18' }}>
              <span>{c.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vex-card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Accesos rápidos</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <a href="/workers" style={{ textDecoration: 'none' }}>
            <button className="btn-vex">+ Nuevo Trabajador</button>
          </a>
          <a href="/cards" style={{ textDecoration: 'none' }}>
            <button className="btn-vex-outline">Gestionar Carnets</button>
          </a>
          <a href="/scan" target="_blank" style={{ textDecoration: 'none' }}>
            <button className="btn-vex-outline">📷 Módulo de Escaneo</button>
          </a>
        </div>
      </div>
    </div>
  );
}
