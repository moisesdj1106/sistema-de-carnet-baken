import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanPage() {
  const [mode, setMode] = useState('qr');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const html5QrRef = useRef(null);
  const processingRef = useRef(false); // ← bloqueo anti-duplicados
  const navigate = useNavigate();

  const processCode = async (cardCode) => {
    // Si ya está procesando un escaneo, ignorar
    if (processingRef.current) return;
    processingRef.current = true;
    setError(''); setResult(null);
    try {
      const res = await api.scan(cardCode.trim());
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Código no válido');
      } else {
        setResult(data);
        setTimeout(() => {
          setResult(null);
          processingRef.current = false; // liberar después de mostrar resultado
        }, 5000);
        return; // no liberar aún, esperar el timeout
      }
    } catch {
      setError('Error de conexión');
    }
    processingRef.current = false;
  };

  const startScanner = async () => {
    if (scanning) return;
    setScanning(true);
    html5QrRef.current = new Html5Qrcode('qr-reader');
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            await processCode(parsed.card_code || decodedText);
          } catch {
            await processCode(decodedText);
          }
        },
        () => {}
      );
    } catch {
      setError('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current && scanning) {
      await html5QrRef.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleModeChange = async (m) => {
    await stopScanner();
    setMode(m); setError(''); setResult(null);
  };

  const handleManual = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    await processCode(code);
    setCode('');
  };

  return (
    <div className="scan-container">
      {/* Botón admin esquina superior derecha */}
      <button
        onClick={() => navigate('/login')}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 14px',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      >
        🔐 Admin
      </button>

      <div className="scan-logo">VEX <span>SHOP</span></div>
      <div className="scan-subtitle">SISTEMA DE CONTROL DE ASISTENCIA</div>

      <div className="scan-box">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['qr', 'manual'].map(m => (
            <button key={m} onClick={() => handleModeChange(m)} style={{
              flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: mode === m ? '#cc0000' : '#f7f8fc',
              color: mode === m ? 'white' : '#555',
              fontWeight: 600, fontSize: 14,
              transition: 'all 0.2s',
            }}>
              {m === 'qr' ? '📷 Escanear QR' : '⌨️ Código Manual'}
            </button>
          ))}
        </div>

        {mode === 'qr' && (
          <div>
            <div id="qr-reader" style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }} />
            {!scanning ? (
              <button className="btn-vex" style={{ width: '100%', marginTop: 16, padding: 12 }} onClick={startScanner}>
                Iniciar Cámara
              </button>
            ) : (
              <button onClick={stopScanner} style={{
                width: '100%', marginTop: 16, padding: 12, background: '#f7f8fc',
                color: '#555', border: '1.5px solid #e8eaf0', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
              }}>
                Detener Cámara
              </button>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleManual}>
            <input
              className="login-input"
              placeholder="Ingresa el código del carnet"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ textTransform: 'uppercase', letterSpacing: 2 }}
              autoFocus
            />
            <button className="btn-vex" style={{ width: '100%', padding: 12 }} type="submit">
              Registrar
            </button>
          </form>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 10, color: '#cc0000', fontSize: 14, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {result && (
        <div className="scan-result">
          {result.worker.photo_url
            ? <img src={result.worker.photo_url} alt="foto" />
            : <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 12px' }}>👤</div>
          }
          <div className="worker-name">{result.worker.full_name}</div>
          <div className="worker-pos">{result.worker.position_name}</div>
          <div style={{
            display: 'inline-block', padding: '8px 28px', borderRadius: 24,
            background: result.event_type === 'entry' ? '#e8f5e9' : '#fce4e4',
            color: result.event_type === 'entry' ? '#2e7d32' : '#c62828',
            fontWeight: 800, fontSize: 17, letterSpacing: 1,
          }}>
            {result.event_type === 'entry' ? '✅ ENTRADA' : '🚪 SALIDA'}
          </div>
          <div style={{ color: '#aaa', fontSize: 13, marginTop: 10 }}>
            {new Date(result.logged_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      )}
    </div>
  );
}
