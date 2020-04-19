export function atou(b64) {
    return decodeURIComponent(escape(atob(b64)));
}

export function utoa(data) {
    return btoa(unescape(encodeURIComponent(data)));
} 