import type { AppError } from "@/lib/errors";

interface ToastErrorProps {
  error: AppError;
  copy?: string;
}

export function ToastError({ error, copy }: ToastErrorProps) {
  if (!copy) return error.message;

  return (
    <div className="flex flex-col items-start gap-1">
      <p>
        <strong>Error: </strong>
        {error.message}
      </p>
      <p>{copy}</p>
    </div>
  );
}
