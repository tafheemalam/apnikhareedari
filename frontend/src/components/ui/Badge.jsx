const palette = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS = {
  pending: 'amber',
  confirmed: 'blue',
  processing: 'blue',
  packed: 'purple',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
  returned: 'red',
  paid: 'green',
  failed: 'red',
  refunded: 'slate',
  approved: 'green',
  rejected: 'red',
};

export default function Badge({ children, color }) {
  const resolved = color || STATUS_COLORS[String(children).toLowerCase()] || 'slate';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${palette[resolved]}`}>
      {children}
    </span>
  );
}
