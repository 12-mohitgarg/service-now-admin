import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useSubcategories } from '../hooks/useSubcategories';
import { ImageUpload } from '../components/ImageUpload';
import type { Subcategory } from '../types';
import './Pages.css';

const emptyForm = { categoryId: '', name: '', iconUrl: '' };

export function Subcategories() {
  const { categories } = useCategories();
  const { subcategories, loading, createSubcategory, updateSubcategory, deleteSubcategory } =
    useSubcategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(sub: Subcategory) {
    setEditing(sub);
    setForm({ categoryId: sub.categoryId, name: sub.name, iconUrl: sub.iconUrl });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true);
    try {
      if (editing) {
        await updateSubcategory(editing.id, form);
      } else {
        await createSubcategory(form);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subcategory?')) return;
    await deleteSubcategory(id);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Subcategories</h1>
          <p>Finer-grained services within each category (e.g. "Pipe leak" under Plumber).</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={categories.length === 0}>
          + Add subcategory
        </button>
      </div>

      {categories.length === 0 && (
        <p className="error-text" style={{ color: 'var(--color-warning)', marginBottom: 16 }}>
          Create a category first before adding subcategories.
        </p>
      )}

      <div className="card table-card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : subcategories.length === 0 ? (
          <div className="empty-state">No subcategories yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Category</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.iconUrl ? <img src={s.iconUrl} className="row-thumb" alt="" /> : <div className="row-thumb" />}
                  </td>
                  <td>{s.name}</td>
                  <td>{categoryName(s.categoryId)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(s)}>
                      Edit
                    </button>{' '}
                    <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit subcategory' : 'Add subcategory'}</h2>
            <div className="form-grid">
              <div className="form-field form-field-full">
                <label>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field form-field-full">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-field form-field-full">
                <label>Icon</label>
                <ImageUpload value={form.iconUrl} onChange={(url) => setForm({ ...form, iconUrl: url })} />
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
