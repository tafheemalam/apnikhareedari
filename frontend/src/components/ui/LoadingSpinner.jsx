export default function LoadingSpinner({ className = '', size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-4' };
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <span className={`animate-spin rounded-full border-emerald-600 border-t-transparent ${sizes[size]}`} />
    </div>
  );
}
