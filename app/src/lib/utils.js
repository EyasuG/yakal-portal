export const ROLE_META = {
  student: { ic: 'student', label: 'Student' },
  parent: { ic: 'parent', label: 'Parent' },
  tutor: { ic: 'tutor', label: 'Tutor' }
};

const ICON = {
  grid: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  student: '<path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5Z"/><circle cx="12" cy="8" r="3.5"/>',
  tutor: '<path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M7 9v5c0 1.5 2.5 3 5 3s5-1.5 5-3V9"/>',
  parent: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 19c0-3 2.5-5 6-5s6 2 6 5M14.5 18c.2-2.3 1.8-4 4-4 2 0 3.5 1.4 3.5 4"/>',
  cap: '<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  wallet: '<rect x="2" y="6" width="20" height="13" rx="2.5"/><path d="M16 12.5h.02"/><path d="M2 10.5h20"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z"/>'
};

export const initials = (name) => name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'YK';
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
export const money = (c) => '$' + (c / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
export const greetMessage = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';
};
export const svgIc = (key, size = 20) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}">${ICON[key] || ''}</svg>`;
