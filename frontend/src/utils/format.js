export function formatCurrency(amount) {
  const value = Number(amount ?? 0);
  return `Rs. ${value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const response = error?.response?.data;
  if (!response) return fallback;
  if (response.errors) {
    const firstField = Object.values(response.errors)[0];
    if (Array.isArray(firstField) && firstField.length) return firstField[0];
  }
  return response.message || fallback;
}
