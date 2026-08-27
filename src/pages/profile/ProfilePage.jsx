import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ProfileSettings from '../settings/ProfileSettings';

export default function ProfilePage() {
  const { isAdmin } = useAuth();
  const backTo = isAdmin ? '/admin' : '/pos';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link
        to={backTo}
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
      >
        ← Back
      </Link>
      
      <ProfileSettings />
    </div>
  );
}
