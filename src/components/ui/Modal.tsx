import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ open, title, children, onClose, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Modal"}
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-xl bg-card/90 ring-1 ring-border shadow-soft",
          className,
        )}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div className="font-display text-base tracking-tight text-fg">{title}</div>
            <button
              aria-label="Fechar"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-card-2 hover:text-fg"
            >
              Fechar
            </button>
          </div>
        ) : null}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

