import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type ModalWidth = "xs" | "sm" | "md" | "lg" | "xl";

const WIDTH_MAP: Record<ModalWidth, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  open,
  onClose,
  children,
  maxWidth = "sm",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: ModalWidth;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — only this has onClose */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/*
            Positioner: pointer-events-none so clicks on empty space
            fall through to the backdrop and trigger onClose.
          */}
          <motion.div
            key="positioner"
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none"
          >
            {/*
              Card: pointer-events-auto re-enables interaction,
              stopPropagation prevents click bubbling to the positioner.
            */}
            <div
              className={cn(
                "pointer-events-auto w-full rounded-2xl border border-slate-800 bg-[#0a0f1a] shadow-2xl",
                WIDTH_MAP[maxWidth],
                className,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
