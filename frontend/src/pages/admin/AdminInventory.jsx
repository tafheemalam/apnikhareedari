import { useEffect, useState } from 'react';
import * as inventoryService from '../../services/admin/inventoryService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatDateTime } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const INCREASE_TYPES = ['purchase', 'return', 'cancellation'];
const DECREASE_TYPES = ['sale', 'damage'];

export default function AdminInventory() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustMode, setAdjustMode] = useState('increase');
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'purchase', notes: '' });
  const [saving, setSaving] = useState(false);

  const [historyTarget, setHistoryTarget] = useState(null);
  const [history, setHistory] = useState(null);

  function load() {
    setLoading(true);
    inventoryService
      .getInventory({ page, search: search || undefined, stock_status: stockStatus || undefined, per_page: 15 })
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, stockStatus]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function openAdjust(item, mode) {
    setAdjustTarget(item);
    setAdjustMode(mode);
    setAdjustForm({ quantity: '', type: mode === 'increase' ? 'purchase' : mode === 'decrease' ? 'sale' : '', notes: '' });
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (adjustMode === 'increase') {
        await inventoryService.increaseStock(adjustTarget.id, adjustForm);
      } else if (adjustMode === 'decrease') {
        await inventoryService.decreaseStock(adjustTarget.id, adjustForm);
      } else {
        await inventoryService.setStock(adjustTarget.id, { quantity: adjustForm.quantity, notes: adjustForm.notes });
      }
      toast.success('Stock updated successfully');
      setAdjustTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openHistory(item) {
    setHistoryTarget(item);
    inventoryService.getHistory(item.id).then((data) => setHistory(data.data));
  }

  const items = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
        <div className="flex flex-wrap gap-2">
          <form onSubmit={handleSearch}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </form>
          <select value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="in">In Stock</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No inventory records found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.product_name}</p>
                    {item.variation_label && <p className="text-xs text-slate-500">{item.variation_label}</p>}
                    <p className="text-xs text-slate-400">{item.product_sku}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.quantity}</td>
                  <td className="px-4 py-3">
                    {item.is_out_of_stock ? <Badge color="red">Out of Stock</Badge> : item.is_low_stock ? <Badge color="amber">Low Stock</Badge> : <Badge color="green">In Stock</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <button onClick={() => openAdjust(item, 'increase')} className="text-emerald-700 hover:underline">Increase</button>
                      <button onClick={() => openAdjust(item, 'decrease')} className="text-red-600 hover:underline">Decrease</button>
                      <button onClick={() => openAdjust(item, 'set')} className="text-slate-600 hover:underline">Set</button>
                      <button onClick={() => openHistory(item)} className="text-blue-600 hover:underline">History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <Modal
        open={!!adjustTarget}
        title={`${adjustMode === 'increase' ? 'Increase' : adjustMode === 'decrease' ? 'Decrease' : 'Set'} Stock — ${adjustTarget?.product_name || ''}`}
        onClose={() => setAdjustTarget(null)}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-3">
          <Input
            label={adjustMode === 'set' ? 'New Quantity' : 'Quantity'}
            type="number"
            min={adjustMode === 'set' ? 0 : 1}
            required
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          {adjustMode !== 'set' && (
            <Select label="Reason" required value={adjustForm.type} onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value }))}>
              {(adjustMode === 'increase' ? INCREASE_TYPES : DECREASE_TYPES).map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </Select>
          )}
          <Input label="Notes (optional)" value={adjustForm.notes} onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" loading={saving} className="w-full">Confirm</Button>
        </form>
      </Modal>

      <Modal open={!!historyTarget} title={`Stock History — ${historyTarget?.product_name || ''}`} onClose={() => setHistoryTarget(null)} size="lg">
        {!history ? (
          <LoadingSpinner size="sm" />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {history.map((tx) => (
              <div key={tx.id} className="py-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge color={tx.quantity >= 0 ? 'green' : 'red'}>{tx.type}</Badge>
                  <span className="font-semibold">{tx.quantity >= 0 ? '+' : ''}{tx.quantity}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{tx.previous_quantity} → {tx.new_quantity} · {formatDateTime(tx.created_at)}</p>
                {tx.notes && <p className="text-xs text-slate-400">{tx.notes}</p>}
                {tx.performed_by && <p className="text-xs text-slate-400">By {tx.performed_by}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
