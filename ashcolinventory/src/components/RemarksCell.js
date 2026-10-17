import React, { useEffect, useId, useRef, useState } from "react";
import { Popover } from "antd";
import "./RemarksCell.css";

export default function RemarksCell({ value, emptyText = "—" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const cardId = useId();
  const headingId = useId();
  const hasRemarks = typeof value === "string" && value.trim().length > 0;

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  if (!hasRemarks) return <span>{emptyText}</span>;

  return (
    <Popover
      trigger="click"
      placement="topRight"
      open={open}
      onOpenChange={setOpen}
      content={(
        <section className="remarks-card" id={cardId} role="dialog" aria-labelledby={headingId}>
          <div className="remarks-card-header">
            <h3 id={headingId}>Remarks</h3>
            <button className="remarks-card-close" type="button" aria-label="Close remarks" onClick={close}>×</button>
          </div>
          <div className="remarks-card-text">{value}</div>
        </section>
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        className="remarks-preview"
        aria-label="View full remarks"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? cardId : undefined}
      >
        {value}
      </button>
    </Popover>
  );
}
