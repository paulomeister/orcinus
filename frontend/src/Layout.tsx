import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium ${isActive ? 'text-ink' : 'text-ink/50 hover:text-ink'}`;

export function Layout() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="flex items-center gap-2 border-b border-gray-200 bg-surface px-6 py-3">
        <span className="mr-4 font-semibold">Orcinus</span>
        <NavLink to="/interactions" className={linkClass}>
          Interacciones
        </NavLink>
        <NavLink to="/metrics" className={linkClass}>
          Métricas
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
