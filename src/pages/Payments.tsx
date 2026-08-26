import { usePayments } from '../hooks/usePayments';
import { useProviders } from '../hooks/useProviders';
import { useCustomers } from '../hooks/useCustomers';
import { useCategories } from '../hooks/useCategories';
import type { Payment } from '../types';
import './Pages.css';

function formatDateTime(dateVal: any): string {
  if (!dateVal) return '—';
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toLocaleString();
  }
  if (typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000).toLocaleString();
  }
  const dateObj = new Date(dateVal);
  return isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleString();
}

export function Payments() {
  const { payments, loading: paymentsLoading } = usePayments();
  const { providers, loading: providersLoading } = useProviders();
  const { customers, loading: customersLoading } = useCustomers();
  const { categories, loading: categoriesLoading } = useCategories();

  const loading = paymentsLoading || providersLoading || customersLoading || categoriesLoading;

  function getPaymentDetails(p: Payment) {
    if (p.type === 'listing') {
      const provider = providers.find((prov) => prov.id === p.userId);
      return provider 
        ? `Listing Fee: ${provider.name} (${provider.email})` 
        : `Listing Fee: User ID ${p.userId}`;
    } else {
      const customer = customers.find((cust) => cust.id === p.userId);
      const provider = providers.find((prov) => prov.id === p.providerId);
      const customerName = customer ? customer.name : `Customer ID ${p.userId}`;
      const providerName = provider ? provider.name : `Provider ID ${p.providerId}`;
      return `Contact Reveal: ${customerName} ➔ ${providerName}`;
    }
  }

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Razorpay transaction log — provider listing fees and customer reveal fees.</p>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">No payments yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Transaction Details</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Razorpay payment ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`badge ${p.type === 'listing' ? 'badge-warning' : 'badge-success'}`} style={{ width: 'fit-content' }}>
                        {p.type === 'listing' ? 'Provider listing' : 'Contact reveal'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {getPaymentDetails(p)}
                      </span>
                    </div>
                  </td>
                  <td>{getCategoryName(p.categoryId)}</td>
                  <td>₹{p.amount}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.razorpayPaymentId}</td>
                  <td>{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
