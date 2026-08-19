export const ACCENT_CLASSES = [
  'bg-accent-blue',
  'bg-accent-green',
  'bg-accent-pink',
  'bg-accent-yellow',
];

export const accentClassForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % ACCENT_CLASSES.length;
  }
  return ACCENT_CLASSES[hash];
};
