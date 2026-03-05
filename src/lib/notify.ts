import { isEditable, formatDateKey } from "@/lib/dates";

export async function notifyAffectedEmployees(
  weekStart: Date,
  affectedUserIds: string[],
  accessToken: string,
): Promise<void> {
  if (isEditable(weekStart, false)) return Promise.resolve();

  return fetch("/api/send-schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      userIds: affectedUserIds,
      weekStart: formatDateKey(weekStart),
    }),
  }).then(() => undefined);
}
