export async function uploadFile(file, chatId = 'profile') {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chatId);
  const res  = await fetch('/api/chat/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload gagal');
  return data.fileUrl;
}

export function formatDuration(s) {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}j ${m}m ${sec}d`;
  if (m > 0) return `${m}m ${sec}d`;
  return `${sec}d`;
}

export function formatDate(d) {
  if (!d) return '';
  const date = new Date(d), now = new Date(), diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
