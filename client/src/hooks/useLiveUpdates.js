import { useEffect } from "react";
import { subscribeToUpdates } from "../liveUpdates";

export default function useLiveUpdates(userId, onChange, onUnauthorized) {
  useEffect(() => {
    if (!userId) return;
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(onChange, 150);
    };
    const stop = subscribeToUpdates({ onChange: refresh, onUnauthorized });
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      clearTimeout(timer);
      stop();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [userId, onChange, onUnauthorized]);
}
