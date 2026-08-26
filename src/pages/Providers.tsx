import { useCategories } from '../hooks/useCategories';
import { useProviders } from '../hooks/useProviders';
import { useSubcategories } from '../hooks/useSubcategories';
import './Pages.css';

export function Providers() {
  const { providers, loading: providersLoading, setProviderStatus } = useProviders();
  const { categories, loading: categoriesLoading } = useCategories();
  const { subcategories, loading: subcategoriesLoading } = useSubcategories();

  const loading = providersLoading || categoriesLoading || subcategoriesLoading;

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  function getSubcategoryNames(subIds: string[]) {
    if (!subIds || subIds.length === 0) return '';
    return subIds
      .map((id) => subcategories.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Providers</h1>
          <p>Service providers who signed up in the app. Unpaid providers stay hidden from customers.</p>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : providers.length === 0 ? (
          <div className="empty-state">No providers yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Category / Services</th>
                <th>Phone</th>
                <th>Listing fee</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.profileImageUrl ? (
                        <img src={p.profileImageUrl} className="row-thumb" alt="" />
                      ) : (
                        <div className="row-thumb" />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>{p.email}</div>
                        {p.address && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 2 }}>
                            📍 {p.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{categoryName(p.categoryId)}</div>
                    {p.subcategoryIds && p.subcategoryIds.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 2 }}>
                        {getSubcategoryNames(p.subcategoryIds)}
                      </div>
                    )}
                  </td>
                  <td>{p.phone}</td>
                  <td>
                    {p.isPaid ? (
                      <span className="badge badge-success">Paid</span>
                    ) : (
                      <span className="badge badge-warning">Unpaid — hidden</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.status === 'active' ? (
                      <button className="btn btn-danger" onClick={() => setProviderStatus(p.id, 'inactive')}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => setProviderStatus(p.id, 'active')}>
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
