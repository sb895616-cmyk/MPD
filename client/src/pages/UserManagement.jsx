import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function StatusBadge({ isActive }) {
  return isActive
    ? <span className="badge badge-green">Active</span>
    : <span className="badge badge-grey">Inactive</span>;
}

function RoleBadge({ role }) {
  return role === 'Admin'
    ? <span className="badge badge-blue">Admin</span>
    : <span className="badge badge-grey">Analyst</span>;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [confirm, setConfirm] = useState(null); // { id, name, newActive }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (_err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/admin/users/${confirm.id}/status`, { isActive: confirm.newActive });
      setConfirm(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
      setConfirm(null);
    }
  };

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title={confirm.newActive ? 'Activate Account' : 'Deactivate Account'}
          message={`Are you sure you want to ${confirm.newActive ? 'activate' : 'deactivate'} "${confirm.name}"?${!confirm.newActive ? ' They will be unable to log in.' : ''}`}
          confirmLabel={confirm.newActive ? 'Activate' : 'Deactivate'}
          danger={!confirm.newActive}
          onConfirm={handleStatusChange}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage analyst and admin accounts</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="form-input"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Analyst">Analyst</option>
        </select>
        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>{error}</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search filters.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    return (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.name}</strong>
                          {isSelf && <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10 }}>You</span>}
                        </td>
                        <td>{u.email}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td><StatusBadge isActive={u.isActive} /></td>
                        <td>{fmtDate(u.createdAt)}</td>
                        <td>
                          {isSelf ? (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            <button
                              className="btn-ghost"
                              style={u.isActive ? { color: 'var(--red)', borderColor: '#fca5a5' } : {}}
                              onClick={() => setConfirm({ id: u._id, name: u.name, newActive: !u.isActive })}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
