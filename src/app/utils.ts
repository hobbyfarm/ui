// Replacement for lodash's escape
export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const unescape = (s: string) =>
  s.replace(/&#(\d+);/g, (_match, charCode) => String.fromCharCode(charCode));

export function uniqueString(n: number) {
  return `${(Math.random().toString(36) + '0000').slice(2, n + 2)}`;
}

// Using the Durstenfeld shuffle algorithm
export function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
export function shuffleStringArray(arr: string[]) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
