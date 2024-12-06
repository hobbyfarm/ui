// Replacement for lodash's escape
export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const unescape = (s: string) =>
  s.replace(/&#(\d+);/g, (_match, charCode) => String.fromCharCode(charCode));

export function uniqueString(n: number) {
  return `${(Math.random().toString(36) + '0000').slice(2, n + 2)}`;
}