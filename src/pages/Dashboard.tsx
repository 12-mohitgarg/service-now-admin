import { useCategories } from '../hooks/useCategories';
import { useCustomers } from '../hooks/useCustomers';
import { usePayments } from '../hooks/usePayments';
import { useProviders } from '../hooks/useProviders';
import './Pages.css';

export function Dashboard() {
  const { providers } = useProviders();
  const { customers } = useCustomers();
  const { categories } = useCategories();
  const { payments } = usePayments();

  const paidProviders = providers.filter((p) => p.isPaid).length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const listingRevenue = payments.filter((p) => p.type === 'listing').reduce((sum, p) => sum + p.amount, 0);
  const revealRevenue = payments.filter((p) => p.type === 'reveal').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your marketplace.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categories.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Providers (paid / total)</div>
          <div className="stat-value">
            {paidProviders} / {providers.length}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total revenue</div>
          <div className="stat-value">₹{totalRevenue}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Listing revenue</div>
          <div className="stat-value">₹{listingRevenue}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Reveal revenue</div>
          <div className="stat-value">₹{revealRevenue}</div>
        </div>
      </div>
    </div>
  );
}
