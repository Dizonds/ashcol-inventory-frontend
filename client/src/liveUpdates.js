import { API_BASE } from "./api";



export function subscribeToUpdates({ onChange, onUnauthorized, fetchImpl = window.fetch.bind(window) }) {
  const controller = new AbortController();
  let stopped = false;
  let retry;

  async function connect() {
    const token = sessionStorage.getItem("ashcol_inventory_token");
    if (stopped || !token) return;
    try {
      const response = await fetchImpl(`${API_BASE}/events`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (response.status === 401) {
        if (!stopped) onUnauthorized();
        return;
      }
      if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
        throw new Error("Live updates are temporarily unavailable.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");
          let end;
          while ((end = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            if (!stopped && /^event: (ready|change)$/m.test(frame)) onChange();
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {

      if (stopped || controller.signal.aborted) return;
    }
    if (!stopped) retry = setTimeout(connect, 2000);
  }

  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    controller.abort();
  };
}
