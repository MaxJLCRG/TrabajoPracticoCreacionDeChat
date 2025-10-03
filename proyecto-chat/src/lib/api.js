// src/lib/api.js
export const API = "http://localhost:4100"; // ajusta el puerto que uses

export async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    const res = await fetch(`${API}${path}`, {
        method: "GET",
        credentials: "include",
        headers,
        ...opts,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}
