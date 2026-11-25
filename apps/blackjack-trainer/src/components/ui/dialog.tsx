import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
  sidePanel = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  sidePanel?: boolean;
}) {
  const [desktop, setDesktop] = useState(
    () => matchMedia("(min-width:1200px)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(min-width:1200px)"),
      changed = () => setDesktop(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  const side = sidePanel && desktop;
  return (
    <DialogPrimitive.Root
      open
      modal={!side}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {!side && <DialogPrimitive.Overlay className="dialog-overlay" />}
        <DialogPrimitive.Content
          className={`dialog-content ${wide ? "wide" : ""} ${side ? "strategy-panel" : ""}`}
          aria-describedby={undefined}
          onInteractOutside={(event) => {
            if (side) event.preventDefault();
          }}
        >
          <div className="dialog-heading">
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="icon-button"
              aria-label="Close panel"
            >
              <X size={22} />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
