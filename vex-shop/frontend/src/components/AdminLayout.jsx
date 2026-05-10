import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/workers', label: 'Trabajadores', icon: '👥' },
  { to: '/cards', label: 'Carnets', icon: '🪪' },
  { to: '/attendance', label: 'Asistencia Hoy', icon: '📋' },
  { to: '/biweekly', label: 'Reporte Quincenal', icon: '📅' },
  { to: '/admins', label: 'Administradores', icon: '🔐' },
];

export default function AdminLayout() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = () => window.innerWidth < 768;
  const [sideOpen, setSideOpen] = useState(!isMobile());

  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) setSideOpen(false);
      else setSideOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNavClick = () => { if (isMobile()) setSideOpen(false); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Overlay para móvil */}
      {sideOpen && isMobile() && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: '#1a1a2e',
        transition: 'transform 0.3s',
        transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: isMobile() ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>
            VEX <span style={{ color: '#cc0000' }}>SHOP</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 3, letterSpacing: 1.5, textTransform: 'uppercase' }}>Control de Asistencia</div>
        </div>
        <nav style={{ flex: 1, padding: '10px 10px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? '#cc0000' : 'transparent',
                fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                borderRadius: 10, marginBottom: 2,
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/scan" target="_blank" style={{
            display: 'block', textAlign: 'center', padding: '9px',
            background: '#cc0000', color: 'white', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 10,
          }}>
            📷 Ir a Escaneo
          </a>
          <button onClick={handleLogout} style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 13,
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <header style={{
          background: 'white', borderBottom: '3px solid #cc0000',
          padding: '0 16px', height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={() => setSideOpen(o => !o)} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#555', padding: 4,
          }}>☰</button>
          <div style={{ fontSize: 13, color: '#888' }}>
            <strong style={{ color: '#1a1a2e' }}>{username}</strong>
          </div>
        </header>
        <main style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
