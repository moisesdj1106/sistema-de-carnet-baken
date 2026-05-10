import { useState, useRef, useCallback } from 'react';

/**
 * PhotoCapture — permite subir una imagen O tomar foto con la cámara.
 * Props:
 *   onPhoto(file) — callback con el File resultante
 *   currentUrl    — URL de foto existente (para preview)
 */
export default function PhotoCapture({ onPhoto, currentUrl }) {
  const [mode, setMode] = useState('idle');       // idle | camera | preview
  const [preview, setPreview] = useState(null);   // data URL para mostrar
  const [camError, setCamError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  // ── Subir archivo ──────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setMode('preview');
    onPhoto(file);
  };

  // ── Abrir cámara ───────────────────────────────────────────────────────
  const openCamera = async () => {
    setCamError('');
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCamError('No se pudo acceder a la cámara');
      setMode('idle');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ── Capturar frame ─────────────────────────────────────────────────────
  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Centrar y recortar cuadrado
    const ox = (video.videoWidth - size) / 2;
    const oy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, ox, oy, size, size, 0, 0, size, size);
    canvas.toBlob(blob => {
      const file = new File([blob], 'foto_camara.jpg', { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setMode('preview');
      stopCamera();
      onPhoto(file);
    }, 'image/jpeg', 0.92);
  };

  const reset = () => {
    stopCamera();
    setPreview(null);
    setMode('idle');
    onPhoto(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const displayUrl = preview || currentUrl;

  return (
    <div>
      <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 8, fontWeight: 600 }}>
        Foto del trabajador
      </label>

      {/* Preview actual */}
      {displayUrl && mode !== 'camera' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <img src={displayUrl} alt="preview"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #cc0000' }}
          />
          <button type="button" onClick={reset}
            style={{ fontSize: 12, color: '#cc0000', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>
            ✕ Quitar foto
          </button>
        </div>
      )}

      {/* Cámara activa */}
      {mode === 'camera' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 10 }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', maxHeight: 260, display: 'block', objectFit: 'cover' }}
            />
            {/* Guía circular */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 180, height: 180, borderRadius: '50%',
                border: '3px solid rgba(204,0,0,0.8)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-vex" style={{ flex: 1, padding: 10 }} onClick={capture}>
              📸 Capturar
            </button>
            <button type="button" onClick={() => { stopCamera(); setMode('idle'); }}
              style={{ flex: 1, padding: 10, background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#555' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Botones de selección */}
      {mode !== 'camera' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 12px', background: '#f7f8fc', border: '1.5px dashed #ccc',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#cc0000'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#ccc'}
          >
            📁 Subir archivo
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          <button type="button" onClick={openCamera} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 12px', background: '#f7f8fc', border: '1.5px dashed #ccc',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#cc0000'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#ccc'}
          >
            📷 Tomar foto
          </button>
        </div>
      )}

      {camError && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#cc0000' }}>⚠️ {camError}</div>
      )}
    </div>
  );
}
