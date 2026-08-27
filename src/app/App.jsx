import { ToastProvider } from '../components/ui/Toast';
import { AuthProvider } from '../hooks/useAuth';
import { appStore } from '../store/appStore';
import AppRoutes from './AppRoutes';
import { useEffect } from 'react';
import { runMigrationCleanup } from '../utils/migrationHelper';

function AppInitializer() {
  useEffect(() => {
    // Run migration cleanup to remove legacy Supabase data
    const didCleanup = runMigrationCleanup();
    if (didCleanup) {
      console.log('[App] Migration cleanup complete - user needs to re-login');
    }

    // Initialize theme from localStorage
    appStore.initTheme();
  }, []);

  return <AppRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInitializer />
      </ToastProvider>
    </AuthProvider>
  );
}
