import { passwordChecks, passwordScore } from '../../utils/validators';

const LEVELS = [
  { label: 'Very Weak', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Weak', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Fair', bar: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Good', bar: 'bg-yellow-500', text: 'text-yellow-600' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-700' },
  { label: 'Very Strong', bar: 'bg-emerald-600', text: 'text-emerald-700' },
];

const REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters' },
  { key: 'upper', label: 'Uppercase letter' },
  { key: 'lower', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'symbol', label: 'Special character' },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = passwordChecks(password);
  const score = passwordScore(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? level.bar : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`mt-1 text-xs font-semibold ${level.text}`}>{level.label}</p>
      <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
        {REQUIREMENTS.map((req) => (
          <li key={req.key} className={`flex items-center gap-1 text-xs ${checks[req.key] ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span>{checks[req.key] ? '✓' : '○'}</span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
