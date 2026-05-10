import jsPDF from 'jspdf';

const CW = 638;   // ~54mm a 300dpi
const CH = 1012;  // ~85.6mm a 300dpi

// Layout — ajustado para que todo quepa con buen espaciado
const HEADER_H   = 200;
const LOGO_R     = 45;
const PHOTO_SIZE = 200;
const PHOTO_Y    = HEADER_H + 20;
const NAME_Y     = PHOTO_Y + PHOTO_SIZE + 52;
const PUESTO_Y   = NAME_Y + 95;
const CEDULA_Y   = PUESTO_Y + 44;
const DIV_Y      = CEDULA_Y + 38;
const QR_SIZE    = 180;
const QR_Y       = DIV_Y + 26;
const CODE_Y     = QR_Y + QR_SIZE + 42;

export async function generateCardPDF(card) {
  const canvas = document.createElement('canvas');
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // ── 1. Fondo tienda ────────────────────────────────────────────────────
  try {
    const bgImg = await loadImage('/tienda.jpg');
    const scale = Math.max(CW / bgImg.width, CH / bgImg.height);
    const sw = bgImg.width * scale;
    const sh = bgImg.height * scale;
    ctx.drawImage(bgImg, (CW - sw) / 2, (CH - sh) / 2, sw, sh);
  } catch {
    ctx.fillStyle = '#0f1432';
    ctx.fillRect(0, 0, CW, CH);
  }

  // ── 2. Overlay — más claro para que se vea la tienda ──────────────────
  ctx.fillStyle = 'rgba(6, 8, 22, 0.42)';   // bajado de 0.62 → 0.42
  ctx.fillRect(0, 0, CW, CH);

  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0,    'rgba(0,0,0,0.30)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.05)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.08)');
  grad.addColorStop(1,    'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // ── 3. Header rojo (más pequeño) ──────────────────────────────────────
  const hGrad = ctx.createLinearGradient(0, 0, 0, HEADER_H);
  hGrad.addColorStop(0,   'rgba(200, 0, 0, 0.97)');
  hGrad.addColorStop(0.75,'rgba(180, 0, 0, 0.88)');
  hGrad.addColorStop(1,   'rgba(160, 0, 0, 0.0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, CW, HEADER_H);

  // Línea blanca fina arriba
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, 0, CW, 6);

  // ── 4. Logo circular a la izquierda ───────────────────────────────────
  const logoCX = 28 + LOGO_R;
  const logoCY = HEADER_H * 0.35;

  // Halo
  const logoHalo = ctx.createRadialGradient(logoCX, logoCY, LOGO_R - 8, logoCX, logoCY, LOGO_R + 18);
  logoHalo.addColorStop(0, 'rgba(255,255,255,0.18)');
  logoHalo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = logoHalo;
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, LOGO_R + 18, 0, Math.PI * 2);
  ctx.fill();

  // Clip circular logo
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, LOGO_R, 0, Math.PI * 2);
  ctx.clip();
  try {
    const logo = await loadImage('/logo.png');
    ctx.drawImage(logo, logoCX - LOGO_R, logoCY - LOGO_R, LOGO_R * 2, LOGO_R * 2);
  } catch {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(logoCX - LOGO_R, logoCY - LOGO_R, LOGO_R * 2, LOGO_R * 2);
  }
  ctx.restore();

  // Borde rojo del logo
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, LOGO_R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Texto empresa
  const textX = logoCX + LOGO_R + 53;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial';
  ctx.letterSpacing = '4px';
  ctx.fillText('VEX SHOP', textX, logoCY + 10);
  ctx.font = '22px Arial';
  ctx.letterSpacing = '0.5px';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.fillText('TARJETA DE IDENTIFICACIÓN', textX, logoCY + 44);
  ctx.letterSpacing = '0px';

  // ── 5. Foto circular trabajador ────────────────────────────────────────
  const photoCX = CW / 2;
  const photoCY = PHOTO_Y + PHOTO_SIZE / 2;
  const photoR  = PHOTO_SIZE / 2;

  // Halo rojo
  const halo = ctx.createRadialGradient(photoCX, photoCY, photoR - 8, photoCX, photoCY, photoR + 26);
  halo.addColorStop(0, 'rgba(204,0,0,0.45)');
  halo.addColorStop(1, 'rgba(204,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoR + 26, 0, Math.PI * 2);
  ctx.fill();

  // Clip circular foto
  ctx.save();
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
  ctx.clip();
  if (card.photo_url) {
    try {
      const photo = await loadImage(card.photo_url);
      const s  = Math.max(PHOTO_SIZE / photo.width, PHOTO_SIZE / photo.height);
      const pw = photo.width * s;
      const ph = photo.height * s;
      ctx.drawImage(photo, photoCX - pw / 2, photoCY - ph / 2, pw, ph);
    } catch {
      drawPhotoFallback(ctx, photoCX, photoCY, photoR);
    }
  } else {
    drawPhotoFallback(ctx, photoCX, photoCY, photoR);
  }
  ctx.restore();

  // Borde rojo foto
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 7;
  ctx.stroke();

  // Borde interior blanco
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoR - 5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── 6. Nombre (dos líneas) ─────────────────────────────────────────────
  ctx.textAlign = 'center';
  const { first, last } = splitName(card.full_name);
  ctx.font = 'bold 46px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 10;
  ctx.fillText(first, CW / 2, NAME_Y);
  ctx.fillText(last,  CW / 2, NAME_Y + 52);
  ctx.shadowBlur = 0;

  // ── 7. Puesto ──────────────────────────────────────────────────────────
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#f41717ff';
  ctx.letterSpacing = '2px';
  ctx.fillText((card.position_name || 'Sin puesto').toUpperCase(), CW / 2, PUESTO_Y);
  ctx.letterSpacing = '0px';

  // ── 8. Cédula ──────────────────────────────────────────────────────────
  ctx.font = '26px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.fillText(`DNI.: ${card.cedula}`, CW / 2, CEDULA_Y);

  // ── 9. Línea divisoria ─────────────────────────────────────────────────
  const lGrad = ctx.createLinearGradient(60, 0, CW - 60, 0);
  lGrad.addColorStop(0,   'rgba(204,0,0,0)');
  lGrad.addColorStop(0.3, 'rgba(204,0,0,0.65)');
  lGrad.addColorStop(0.7, 'rgba(204,0,0,0.65)');
  lGrad.addColorStop(1,   'rgba(204,0,0,0)');
  ctx.strokeStyle = lGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, DIV_Y);
  ctx.lineTo(CW - 60, DIV_Y);
  ctx.stroke();

  // ── 10. QR ────────────────────────────────────────────────────────────
  const qrX = (CW - QR_SIZE) / 2;

  // Fondo blanco con sombra
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX - 12, QR_Y - 12, QR_SIZE + 24, QR_SIZE + 24, 16);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (card.qr_data) {
    try {
      const qrImg = await loadImage(card.qr_data);
      ctx.drawImage(qrImg, qrX, QR_Y, QR_SIZE, QR_SIZE);
    } catch {}
  }

  // ── 11. Código único ──────────────────────────────────────────────────
  ctx.font = '22px Arial';
  ctx.fillStyle = 'rgba(212, 212, 221, 0.9)';
  ctx.fillText('CÓDIGO DE ACCESO', CW / 2, CODE_Y);

  ctx.font = 'bold 30px monospace';
  ctx.fillStyle = 'rgba(249, 249, 254, 0.95)';
  ctx.letterSpacing = '3px';
  ctx.fillText(card.card_code, CW / 2, CODE_Y + 40);
  ctx.letterSpacing = '0px';

  // ── 12. Footer ────────────────────────────────────────────────────────
  const fGrad = ctx.createLinearGradient(0, CH - 16, 0, CH);
  fGrad.addColorStop(0, 'rgba(180,0,0,0)');
  fGrad.addColorStop(1, 'rgba(180,0,0,0.55)');
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, CH - 16, CW, 16);

  // ── Exportar PDF ──────────────────────────────────────────────────────
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [54, 85.6] });
  pdf.addImage(imgData, 'JPEG', 0, 0, 54, 85.6);
  pdf.save(`carnet_${card.full_name.replace(/\s+/g, '_')}_${card.card_code}.pdf`);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function drawPhotoFallback(ctx, cx, cy, r) {
  ctx.fillStyle = '#1a1a3e';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.font = `${r}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('?', cx, cy + r * 0.35);
}

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  if (parts.length <= 2) return { first: parts[0] || '', last: parts[1] || '' };
  const mid = Math.ceil(parts.length / 2);
  return { first: parts.slice(0, mid).join(' '), last: parts.slice(mid).join(' ') };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
