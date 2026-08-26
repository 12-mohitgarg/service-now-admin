import { useCustomers } from '../hooks/useCustomers';
import './Pages.css';

function formatDate(dateVal: any): string {
  if (!dateVal) return '—';
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toLocaleDateString();
  }
  if (typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000).toLocaleDateString();
  }
  const dateObj = new Date(dateVal);
  return isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString();
}

export function Customers() {
  const { customers, loading } = useCustomers();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>People who signed up to browse and unlock service providers.</p>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">No customers yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
