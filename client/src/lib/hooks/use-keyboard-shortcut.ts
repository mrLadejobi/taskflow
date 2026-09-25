import { useEffect } from "react";

interface ShortcutOptions {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Allow firing even when the user is focused inside an input/textarea */
  ignoreInputs?: boolean;
}

/**
 * Custom hook to register keyboard shortcuts with modifier support.
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {},
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid firing when user is typing in form controls unless explicitly permitted
      if (!options.ignoreInputs) {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
      }

      const matchKey = event.key.toLowerCase() === key.toLowerCase();
      const matchCtrl = options.ctrl ? event.ctrlKey || event.metaKey : true;
      const matchShift = options.shift ? event.shiftKey : true;
      const matchAlt = options.alt ? event.altKey : true;

      if (matchKey && matchCtrl && matchShift && matchAlt) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options]);
}
