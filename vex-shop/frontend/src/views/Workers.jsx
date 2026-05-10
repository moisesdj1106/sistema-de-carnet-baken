import { useEffect, useState } from 'react';
import { api } from '../api';
import PhotoCapture from '../components/PhotoCapture';

const emptyForm = { full_name: '', cedula: '', position_id: '', email: '', phone: '' };

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [wRes, pRes] = await Promise.all([api.getWorkers(), api.getPositions()]);
    const wData = await wRes.json();
    const pData = await pRes.json();
    setWorkers(Array.isArray(wData) ? wData : []);
    setPositions(Array.isArray(pData) ? pData : []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setPhoto(null); setEditing(null); setShowModal(true); };
  const openEdit = (w) => {
    setForm({ full_name: w.full_name, cedula: w.cedula, position_id: w.position_id, email: w.email || '', phone: w.phone || '' });
    setPhoto(null); setEditing(w.id); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append('photo', photo);
    const res = editing ? await api.updateWorker(editing, fd) : await api.createWorker(fd);
    if (res.ok) { setShowModal(false); load(); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este trabajador?')) return;
    await api.deleteWorker(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Trabajadores</h2>
        <button className="btn-vex" onClick={openCreate}>+ Nuevo Trabajador</button>
      </div>

      <div className="vex-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
        <table className="vex-table">
          <thead>
            <tr>
              <th>Foto</th><th>Nombre</th><th>Cédula</th><th>Puesto</th><th>Teléfono</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.id}>
                <td>
                  {w.photo_url
                    ? <img src={w.photo_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  }
                </td>
                <td><strong>{w.full_name}</strong></td>
                <td>{w.cedula}</td>
                <td>{w.position_name || '-'}</td>
                <td>{w.phone || '-'}</td>
                <td>
                  <button onClick={() => openEdit(w)} style={{ marginRight: 8, background: '#f0f0f0', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(w.id)} style={{ background: '#fff0f0', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#cc0000' }}>🗑️</button>
                </td>
              </tr>
            ))}
            {!workers.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>No hay trabajadores registrados</td></tr>}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px' }}>{editing ? 'Editar' : 'Nuevo'} Trabajador</h3>
            <form onSubmit={handleSubmit}>
              {[['full_name','Nombre completo'],['cedula','Cédula'],['email','Email'],['phone','Teléfono']].map(([k,l]) => (
                <input key={k} placeholder={l} value={form[k]} required={k==='full_name'||k==='cedula'}
                  onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', marginBottom:12, border:'1px solid #ddd', borderRadius:8, fontSize:14 }}
                />
              ))}
              <select value={form.position_id} onChange={e => setForm(f => ({...f, position_id: e.target.value}))}
                style={{ width:'100%', padding:'10px 12px', marginBottom:12, border:'1px solid #ddd', borderRadius:8, fontSize:14 }}>
                <option value="">Seleccionar puesto</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div style={{ marginBottom: 16 }}>
                <PhotoCapture
                  onPhoto={file => setPhoto(file)}
                  currentUrl={editing ? workers.find(w => w.id === editing)?.photo_url : null}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-vex-outline">Cancelar</button>
                <button type="submit" className="btn-vex" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
