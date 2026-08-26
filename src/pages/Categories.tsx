import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { usePricing, pricingId } from '../hooks/usePricing';
import { ImageUpload } from '../components/ImageUpload';
import type { Category } from '../types';
import './Pages.css';

const emptyForm = { name: '', iconUrl: '', listingFee: '', revealFee: '' };

export function Categories() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { pricing, setPricingFor } = usePricing();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function feesFor(categoryId: string) {
    const p = pricing.find((row) => row.id === pricingId(categoryId, null));
    return { listingFee: p ? String(p.listingFee) : '', revealFee: p ? String(p.revealFee) : '' };
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name, iconUrl: category.iconUrl, ...feesFor(category.id) });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { listingFee, revealFee, ...categoryData } = form;
      const categoryId = editing ? editing.id : await createCategory(categoryData);
      if (editing) {
        await updateCategory(editing.id, categoryData);
      }
      await setPricingFor(categoryId, null, Number(listingFee || 0), Number(revealFee || 0));
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Subcategories under it will remain but become orphaned.')) return;
    await deleteCategory(id);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Top-level service categories shown on the customer dashboard, with their fees.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add category
        </button>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">No categories yet. Add your first one.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Listing fee</th>
                <th>Reveal fee</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const fees = feesFor(c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      {c.iconUrl ? <img src={c.iconUrl} className="row-thumb" alt="" /> : <div className="row-thumb" />}
                    </td>
                    <td>{c.name}</td>
                    <td>₹{fees.listingFee || 0}</td>
                    <td>₹{fees.revealFee || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost" onClick={() => openEdit(c)}>
                        Edit
                      </button>{' '}
                      <button className="btn btn-danger" onClick={() => handleDelete(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit category' : 'Add category'}</h2>
            <div className="form-grid">
              <div className="form-field form-field-full">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-field form-field-full">
                <label>Icon</label>
                <ImageUpload value={form.iconUrl} onChange={(url) => setForm({ ...form, iconUrl: url })} />
              </div>
              <div className="form-field">
                <label>Listing fee (₹) — paid by service provider</label>
                <input
                  type="number"
                  min={0}
                  value={form.listingFee}
                  onChange={(e) => setForm({ ...form, listingFee: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Reveal fee (₹) — paid by normal user</label>
                <input
                  type="number"
                  min={0}
                  value={form.revealFee}
                  onChange={(e) => setForm({ ...form, revealFee: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
