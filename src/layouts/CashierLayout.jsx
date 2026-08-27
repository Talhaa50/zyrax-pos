import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function CashierLayout() {
  return (
    <div className="flex h-screen flex-col bg-surface-secondary dark:bg-black overflow-hidden">
      <Navbar compact />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
