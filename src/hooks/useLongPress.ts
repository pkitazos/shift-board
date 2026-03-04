import { useCallback, useRef } from "react";

const LONG_PRESS_MS = 500;

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: React.SyntheticEvent) => void;
}

export function useLongPress(onLongPress: () => void): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only respond to primary pointer (no right-click)
      if (e.button !== 0) return;
      clear();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [onLongPress, clear],
  );

  const onContextMenu = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerUp: clear,
    onPointerCancel: clear,
    onContextMenu,
  };
}
