interface DeleteModeBarProps {
  onDone: () => void;
}

export function DeleteModeBar({ onDone }: DeleteModeBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <div className="flex items-center gap-3 rounded-full bg-foreground py-1.5 pr-1.5 pl-4 shadow-lg">
        <span className="text-xs text-background/70">
          Tap X to remove shifts
        </span>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-background px-4 py-1.5 text-sm font-medium text-foreground"
        >
          Done
        </button>
      </div>
    </div>
  );
}
