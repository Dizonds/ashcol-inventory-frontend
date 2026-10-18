import React, { useEffect, useState } from "react";
import "./NotificationStack.css";

function NotificationCard({ notice, index, total, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => onDismiss(notice.id), 320);
    return () => clearTimeout(timer);
  }, [leaving, notice.id, onDismiss]);

  const isError = notice.type === "error";
  return (
    <div className="notice-layer" style={{ "--stack-index": index, zIndex: total - index }}>
      <div
        className={`notice-card ${isError ? "notice-error" : "notice-success"}${leaving ? " is-leaving" : ""}`}
        role={isError ? "alert" : "status"}
        aria-atomic="true"
      >
        <svg className="notice-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
          {isError ? (
            <path d="M12 7v6m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="m7 12 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        <p>{notice.text}</p>
        <button
          type="button"
          className="notice-close"
          aria-label={`Dismiss notification: ${notice.text}`}
          tabIndex={index === 0 ? 0 : -1}
          disabled={leaving}
          onClick={() => setLeaving(true)}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default function NotificationStack({ notices, onDismiss }) {
  return (
    <div className="notification-stack" role="region" aria-label="Notifications">
      {notices.map((notice, index) => (
        <NotificationCard key={notice.id} notice={notice} index={index} total={notices.length} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
