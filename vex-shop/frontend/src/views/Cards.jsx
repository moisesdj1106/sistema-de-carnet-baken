import { useEffect, useState } from 'react';
import { api } from '../api';
import { generateCardPDF } from '../utils/cardPDF';

// Preview visual del carnet (vertical, igual al PDF)
function CardPreview({ card }) {
  const parts = splitName(card.full_name);
  return (
    <div style={{
      width: 180,
      height: 285,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      flexShrink: 0,
      background: '#080b1b',
    }}>
      {/* Fondo imagen tienda */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/tienda.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(1px) brightness(0.35)',
      }} />

      {/* Overlay degradado */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,10,30,0.55) 0%, rgba(10,10,30,0.85) 100%)',
      }} />

      {/* Franja roja superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        background: 'linear-gradient(135deg, #cc0000 0%, #990000 100%)',
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
      }}>
        <img src="/logo.jpg" alt="logo"
          style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div>
          <div style={{ color: 'white', fontWeight: 900, fontSize: 13, letterSpacing: 2, lineHeight: 1 }}>VEX SHOP</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 7, letterSpacing: 1, marginTop: 2 }}>TARJETA DE IDENTIFICACIÓN</div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 62 }}>
        {/* Foto */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: '3px solid #cc0000',
          overflow: 'hidden', background: '#1a1a3e',
          boxShadow: '0 0 0 4px rgba(204,0,0,0.2)',
          marginBottom: 10,
        }}>
          {card.photo_url
            ? <img src={card.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#555' }}>👤</div>
          }
        </div>

        {/* Nombre en dos líneas */}
        <div style={{ color: 'white', fontWeight: 800, fontSize: 11, textAlign: 'center', lineHeight: 1.3, padding: '0 10px' }}>
          {parts.first}
        </div>
        <div style={{ color: 'white', fontWeight: 800, fontSize: 11, textAlign: 'center', lineHeight: 1.3, padding: '0 10px', marginBottom: 4 }}>
          {parts.last}
        </div>

        {/* Puesto */}
        <div style={{
          color: '#cc0000', fontSize: 8, fontWeight: 700,
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
        }}>
          {card.position_name || 'Sin puesto'}
        </div>

        {/* Cédula */}
        <div style={{ color: 'rgba(200,200,220,0.7)', fontSize: 8, marginBottom: 10 }}>
          C.I.: {card.cedula}
        </div>

        {/* Línea divisoria */}
        <div style={{ width: '80%', height: 1, background: 'rgba(204,0,0,0.4)', marginBottom: 10 }} />

        {/* QR */}
        {card.qr_data && (
          <div style={{
            background: 'white', borderRadius: 8, padding: 4,
            width: 64, height: 64, marginBottom: 8,
          }}>
            <img src={card.qr_data} alt="QR" style={{ width: '100%', height: '100%' }} />
          </div>
        )}

        {/* Código */}
        <div style={{ color: 'rgba(180,180,200,0.6)', fontSize: 7, letterSpacing: 1, marginBottom: 2 }}>CÓDIGO</div>
        <div style={{ color: 'rgba(220,220,240,0.9)', fontSize: 8, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>
          {card.card_code}
        </div>
      </div>
    </div>
  );
}

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  if (parts.length <= 2) return { first: parts[0] || '', last: parts[1] || '' };
  const mid = Math.ceil(parts.length / 2);
  return { first: parts.slice(0, mid).join(' '), last: parts.slice(mid).join(' ') };
}

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = async () => {
    const [cRes, wRes] = await Promise.all([api.getCards(), api.getWorkers()]);
    const cardsData = await cRes.json();
    const workersData = await wRes.json();
    setCards(Array.isArray(cardsData) ? cardsData : []);
    setWorkers(Array.isArray(workersData) ? workersData : []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!selectedWorker) return alert('Selecciona un trabajador');
    setLoading(true);
    const res = await api.createCard({ worker_id: selectedWorker });
    if (res.ok) { setSelectedWorker(''); load(); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este carnet?')) return;
    await api.deleteCard(id);
    if (preview?.id === id) setPreview(null);
    load();
  };

  const handleToggle = async (id) => {
    await api.toggleCard(id);
    load();
  };

  const handleDownload = async (cardId) => {
    const res = await api.getCard(cardId);
    const card = await res.json();
    generateCardPDF(card);
  };

  const handlePreview = async (cardId) => {
    if (preview?.id === cardId) { setPreview(null); return; }
    const res = await api.getCard(cardId);
    setPreview(await res.json());
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Carnets de Identificación</h2>
      </div>

      {/* Generador */}
      <div className="vex-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Trabajador</label>
          <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}>
            <option value="">Seleccionar trabajador...</option>
            {workers.map(w => <option key={w.id} value={w.id}>{w.full_name} - {w.cedula}</option>)}
          </select>
        </div>
        <button className="btn-vex" onClick={handleCreate} disabled={loading}>
          {loading ? 'Generando...' : '+ Generar Carnet'}
        </button>
      </div>

      {/* Preview modal */}
      {preview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }} onClick={() => setPreview(null)}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <CardPreview card={preview} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-vex" onClick={() => handleDownload(preview.id)}>📄 Descargar PDF</button>
              <button onClick={() => setPreview(null)} style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: 'white', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600,
              }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="vex-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
        <table className="vex-table">
          <thead>
            <tr>
              <th>Trabajador</th><th>Puesto</th><th>Código</th><th>Estado</th><th>Creado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.photo_url
                      ? <img src={c.photo_url} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                      : <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    }
                    <strong>{c.full_name}</strong>
                  </div>
                </td>
                <td>{c.position_name || '-'}</td>
                <td><code style={{ background: '#f4f4f4', padding: '3px 10px', borderRadius: 6, fontSize: 12, letterSpacing: 1.5, fontWeight: 700 }}>{c.card_code}</code></td>
                <td>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: c.is_active ? '#e8f5e9' : '#fce4e4',
                    color: c.is_active ? '#2e7d32' : '#c62828',
                  }}>
                    {c.is_active ? '● Activo' : '● Inactivo'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('es-VE')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handlePreview(c.id)} title="Vista previa"
                      style={{ background: '#f3e5f5', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>👁️</button>
                    <button onClick={() => handleDownload(c.id)} title="Descargar PDF"
                      style={{ background: '#e3f2fd', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>📄 PDF</button>
                    <button onClick={() => handleToggle(c.id)} title={c.is_active ? 'Desactivar' : 'Activar'}
                      style={{ background: '#fff8e1', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
                      {c.is_active ? '🔒' : '🔓'}
                    </button>
                    <button onClick={() => handleDelete(c.id)} title="Eliminar"
                      style={{ background: '#fff0f0', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#cc0000' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {!cards.length && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No hay carnets generados</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
