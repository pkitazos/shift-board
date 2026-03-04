import { useSyncExternalStore } from "react";

const ROW_HEIGHT_ESTIMATE = 100;
const CHROME_HEIGHT = 140;
const MIN_WEEKS = 4;

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function getSnapshot() {
  return Math.max(
    MIN_WEEKS,
    Math.floor((window.innerHeight - CHROME_HEIGHT) / ROW_HEIGHT_ESTIMATE),
  );
}

export function useWeeksToShow() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
