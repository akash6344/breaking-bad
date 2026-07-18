import { useEffect, useRef } from 'react';

interface ResetPlanDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetPlanDialog({ onCancel, onConfirm }: ResetPlanDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    // showModal supplies focus containment and makes the page behind the dialog inert.
    // The attribute fallback keeps the component testable in DOM implementations
    // that do not yet implement the native dialog methods.
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }, []);

  return <dialog
    ref={dialogRef}
    className="reset-confirm"
    role="alertdialog"
    aria-labelledby="reset-title"
    aria-describedby="reset-description"
    onCancel={(event) => { event.preventDefault(); onCancel(); }}
  >
    <h2 id="reset-title">Reset your plan?</h2>
    <p id="reset-description">This permanently deletes this plan and its check-in history from this browser. Other website data will not be affected.</p>
    <div className="dialog-actions">
      <button className="secondary" onClick={onCancel} autoFocus>Keep my plan</button>
      <button className="danger-button" onClick={onConfirm}>Reset and delete</button>
    </div>
  </dialog>;
}
