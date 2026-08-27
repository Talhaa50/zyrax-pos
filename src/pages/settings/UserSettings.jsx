import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../../services/api/usersApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { formatDate } from '../../utils/formatCurrency';

/* ── Role Badge ──────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
      <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
      Cashier
    </span>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────── */
function StatusBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-white/[0.08] dark:text-gray-400">
      Inactive
    </span>
  );
}

/* ── Initials Avatar ─────────────────────────────────────────────────── */
function UserAvatar({ name, role }) {
  const initials = (name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAdm = role === 'admin';

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow-sm ${
        isAdm
          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
          : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
      }`}
    >
      {initials}
    </div>
  );
}

export default function UserSettings() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'cashier',
    password: '',
    active: true,
  });
  const [createErrors, setCreateErrors] = useState({});

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'cashier',
    active: true,
  });
  const [editErrors, setEditErrors] = useState({});

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle create user
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!createForm.name.trim()) errs.name = 'Full name is required';
    if (!createForm.email.trim()) errs.email = 'Email is required';
    if (!createForm.password || createForm.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.create(createForm);
      toast.success(`User ${createForm.name} created successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        role: 'cashier',
        password: '',
        active: true,
      });
      setCreateErrors({});
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit modal
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active === 1,
    });
    setEditErrors({});
  };

  // Handle edit user
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editForm.name.trim()) errs.name = 'Full name is required';
    if (!editForm.email.trim()) errs.email = 'Email is required';

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.update(editingUser.id, editForm);
      toast.success(`User ${editForm.name} updated successfully!`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle set password
  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.setPassword(passwordTargetUser.id, newPassword);
      toast.success(`Password updated for ${passwordTargetUser.name}!`);
      setPasswordTargetUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (err) {
      toast.error(err.message || 'Failed to set password');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      const res = await usersApi.delete(deletingUser.id);
      toast.success(res.message || 'User deleted successfully');
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchQuery && matchRole;
  });

  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const cashierCount = users.filter((u) => u.role === 'cashier').length;
  const activeCount = users.filter((u) => u.active === 1).length;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>User Management</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create users, assign Admin & Cashier roles, and set account passwords.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-600 hover:bg-brand-500 shadow-ios"
        >
          + Add New User
        </Button>
      </div>

      {/* ── Stats Strip ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : totalCount}</p>
          <p className="mt-1 text-xs text-gray-400">Registered staff accounts</p>
        </div>

        <div className="rounded-2xl border border-violet-200/60 bg-violet-50/70 p-5 shadow-ios dark:border-violet-800/40 dark:bg-violet-900/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Admins</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : adminCount}</p>
          <p className="mt-1 text-xs text-gray-400">Full system access</p>
        </div>

        <div className="rounded-2xl border border-teal-200/60 bg-teal-50/70 p-5 shadow-ios dark:border-teal-800/40 dark:bg-teal-900/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">Cashiers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : cashierCount}</p>
          <p className="mt-1 text-xs text-gray-400">POS checkout access</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 p-5 shadow-ios dark:border-emerald-800/40 dark:bg-emerald-900/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Active Accounts</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : activeCount}</p>
          <p className="mt-1 text-xs text-gray-400">Can log in currently</p>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-ios-inset placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/[0.08] dark:bg-[#242220] dark:text-gray-100"
          />

          <div className="flex gap-1.5 rounded-xl border border-black/[0.05] bg-white p-1 dark:border-white/[0.08] dark:bg-[#1a1917]">
            {['all', 'admin', 'cashier'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-brand-600 text-white shadow-ios'
                    : 'text-gray-600 hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.06]'
                }`}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Users Table ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-ios dark:border-white/[0.07] dark:bg-[#1a1917]">
        {loading ? (
          <div className="animate-pulse p-8 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04] text-2xl dark:bg-white/[0.06]">
              👥
            </div>
            <p className="font-heading text-base font-semibold text-gray-500">No users found</p>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery || roleFilter !== 'all'
                ? 'Try adjusting your search query or filters'
                : 'Click "+ Add New User" above to create an account'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} role={u.role} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                              {isCurrent && (
                                <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <RoleBadge role={u.role} />
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge active={u.active} />
                      </td>

                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {u.created_at ? formatDate(u.created_at) : '—'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Set Password button */}
                          <button
                            type="button"
                            title="Set Password"
                            onClick={() => {
                              setPasswordTargetUser(u);
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError('');
                            }}
                            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 active:scale-95 dark:text-amber-300 dark:hover:bg-amber-900/30"
                          >
                            🔑 Password
                          </button>

                          {/* Edit user details */}
                          <button
                            type="button"
                            title="Edit User"
                            onClick={() => openEditModal(u)}
                            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-all hover:bg-brand-50 active:scale-95 dark:text-brand-400 dark:hover:bg-brand-900/30"
                          >
                            ✏️ Edit
                          </button>

                          {/* Delete user (disabled for self) */}
                          <button
                            type="button"
                            title={isCurrent ? 'Cannot delete yourself' : 'Delete User'}
                            disabled={isCurrent}
                            onClick={() => setDeletingUser(u)}
                            className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-gray-400'
                                : 'text-rose-600 hover:bg-rose-50 active:scale-95 dark:text-rose-400 dark:hover:bg-rose-900/30'
                            }`}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal 1: Create New User ─────────────────────────────────── */}
      <Modal
        open={showCreateModal}
        onClose={() => !actionLoading && setShowCreateModal(false)}
        title="Add New User"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={actionLoading}>
              {actionLoading ? 'Creating User...' : 'Create User'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Hassan Ahmed"
            value={createForm.name}
            onChange={(e) => {
              setCreateForm({ ...createForm, name: e.target.value });
              setCreateErrors({ ...createErrors, name: null });
            }}
            error={createErrors.name}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. hassan@retailer.com"
            value={createForm.email}
            onChange={(e) => {
              setCreateForm({ ...createForm, email: e.target.value });
              setCreateErrors({ ...createErrors, email: null });
            }}
            error={createErrors.email}
          />

          {/* Role selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Role & Permissions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer flex-col rounded-2xl border p-3.5 transition-all ${
                  createForm.role === 'cashier'
                    ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20 dark:bg-teal-900/20'
                    : 'border-black/[0.08] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Cashier</span>
                  <input
                    type="radio"
                    name="create-role"
                    checked={createForm.role === 'cashier'}
                    onChange={() => setCreateForm({ ...createForm, role: 'cashier' })}
                    className="accent-teal-600"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">POS checkout, barcode scan & sales history</p>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-2xl border p-3.5 transition-all ${
                  createForm.role === 'admin'
                    ? 'border-violet-500 bg-violet-50/60 ring-2 ring-violet-500/20 dark:bg-violet-900/20'
                    : 'border-black/[0.08] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Admin</span>
                  <input
                    type="radio"
                    name="create-role"
                    checked={createForm.role === 'admin'}
                    onChange={() => setCreateForm({ ...createForm, role: 'admin' })}
                    className="accent-violet-600"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Full system, inventory, reports & settings</p>
              </label>
            </div>
          </div>

          <Input
            label="Initial Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={createForm.password}
            onChange={(e) => {
              setCreateForm({ ...createForm, password: e.target.value });
              setCreateErrors({ ...createErrors, password: null });
            }}
            error={createErrors.password}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="create-active"
              checked={createForm.active}
              onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })}
              className="h-4 w-4 rounded accent-brand-600"
            />
            <label htmlFor="create-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Active (User can log in immediately)
            </label>
          </div>
        </form>
      </Modal>

      {/* ── Modal 2: Edit User ───────────────────────────────────────── */}
      <Modal
        open={!!editingUser}
        onClose={() => !actionLoading && setEditingUser(null)}
        title={`Edit User — ${editingUser?.name}`}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setEditingUser(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => {
              setEditForm({ ...editForm, name: e.target.value });
              setEditErrors({ ...editErrors, name: null });
            }}
            error={editErrors.name}
          />

          <Input
            label="Email Address"
            type="email"
            value={editForm.email}
            onChange={(e) => {
              setEditForm({ ...editForm, email: e.target.value });
              setEditErrors({ ...editErrors, email: null });
            }}
            error={editErrors.email}
          />

          {/* Role selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Role & Permissions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer flex-col rounded-2xl border p-3.5 transition-all ${
                  editForm.role === 'cashier'
                    ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20 dark:bg-teal-900/20'
                    : 'border-black/[0.08] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Cashier</span>
                  <input
                    type="radio"
                    name="edit-role"
                    checked={editForm.role === 'cashier'}
                    onChange={() => setEditForm({ ...editForm, role: 'cashier' })}
                    className="accent-teal-600"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">POS checkout access</p>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-2xl border p-3.5 transition-all ${
                  editForm.role === 'admin'
                    ? 'border-violet-500 bg-violet-50/60 ring-2 ring-violet-500/20 dark:bg-violet-900/20'
                    : 'border-black/[0.08] hover:bg-black/[0.02] dark:border-white/[0.08] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Admin</span>
                  <input
                    type="radio"
                    name="edit-role"
                    checked={editForm.role === 'admin'}
                    onChange={() => setEditForm({ ...editForm, role: 'admin' })}
                    className="accent-violet-600"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Full system admin access</p>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-active"
              checked={editForm.active}
              onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              className="h-4 w-4 rounded accent-brand-600"
            />
            <label htmlFor="edit-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Active (User can log in)
            </label>
          </div>
        </form>
      </Modal>

      {/* ── Modal 3: Set User Password ───────────────────────────────── */}
      <Modal
        open={!!passwordTargetUser}
        onClose={() => !actionLoading && setPasswordTargetUser(null)}
        title={`Set Password for ${passwordTargetUser?.name}`}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setPasswordTargetUser(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSetPasswordSubmit} disabled={actionLoading}>
              {actionLoading ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            As an admin, you are directly setting a new password for{' '}
            <strong className="font-semibold">{passwordTargetUser?.email}</strong>. The user will use this new password to sign in immediately.
          </div>

          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError('');
            }}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError('');
            }}
          />

          {passwordError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {passwordError}
            </p>
          )}
        </form>
      </Modal>

      {/* ── Modal 4: Delete User Confirmation ───────────────────────── */}
      <ConfirmModal
        open={!!deletingUser}
        onClose={() => !actionLoading && setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete User: ${deletingUser?.name}`}
        message={`Are you sure you want to remove ${deletingUser?.name} (${deletingUser?.email})? If this user has past sales records, their account will be deactivated to keep historical sales logs intact.`}
        loading={actionLoading}
      />
    </div>
  );
}
