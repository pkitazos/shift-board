import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { startOfWeek, addDays, format } from "date-fns";
import type { Database } from "../src/types/database";
import ScheduleEmail, { buildDaysArray } from "../src/emails/schedule-email";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

function serviceClient() {
  return createClient<Database>(supabaseUrl, supabaseSecretKey);
}

function errorResponse(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return handleCron(req, res);
  if (req.method === "POST") return handleOverride(req, res);
  return errorResponse(res, 405, "Method not allowed");
}

async function handleCron(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return errorResponse(res, 401, "Unauthorized");
  }

  const db = serviceClient();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  // Fetch all users -- admins who also work shifts should get the email too
  const { data: users, error: usersErr } = await db.from("users").select("id");

  if (usersErr) return errorResponse(res, 500, usersErr.message);

  const userIds = users.map((u) => u.id);

  return sendEmails(db, userIds, weekStartStr, false).then((sent) =>
    res.status(200).json({ sent }),
  );
}

async function handleOverride(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return errorResponse(res, 401, "Missing token");

  // Verify caller is admin
  const authClient = createClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
  const { data: isAdmin, error: rpcErr } = await authClient.rpc("is_admin");
  if (rpcErr || !isAdmin) return errorResponse(res, 403, "Forbidden");

  const { userIds, weekStart } = req.body as {
    userIds: string[];
    weekStart: string;
  };

  if (
    !Array.isArray(userIds) ||
    !userIds.length ||
    !weekStart?.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    return errorResponse(
      res,
      400,
      "Invalid body: need userIds[] and weekStart (YYYY-MM-DD)",
    );
  }

  const db = serviceClient();

  return sendEmails(db, userIds, weekStart, true).then((sent) =>
    res.status(200).json({ sent }),
  );
}

type ServiceClient = ReturnType<typeof serviceClient>;

interface UserShiftGroup {
  name: string | null;
  email: string;
  shifts: { date: string; type: "full" | "half" | null }[];
}

async function sendEmails(
  db: ServiceClient,
  userIds: string[],
  weekStart: string,
  isOverride: boolean,
): Promise<number> {
  const weekEnd = format(addDays(new Date(weekStart), 6), "yyyy-MM-dd");

  const { data: shifts, error: shiftsErr } = await db
    .from("shifts")
    .select("date, type, user_id, users(id, name, email, nickname)")
    .in("user_id", userIds)
    .gte("date", weekStart)
    .lte("date", weekEnd);

  if (shiftsErr) {
    console.error("Failed to fetch shifts:", shiftsErr.message);
    return 0;
  }

  // Group shifts by user
  const byUser = (shifts ?? []).reduce<Record<string, UserShiftGroup>>(
    (acc, row) => {
      const user = row.users as unknown as {
        id: string;
        name: string | null;
        email: string;
        nickname: string | null;
      };
      const entry = (acc[user.id] ??= {
        name: user.nickname ?? user.name,
        email: user.email,
        shifts: [],
      });
      entry.shifts.push({ date: row.date, type: row.type });
      return acc;
    },
    {},
  );

  // For cron, skip users with zero shifts
  const entries: [string, UserShiftGroup][] = Object.entries(byUser).filter(
    ([, v]) => isOverride || v.shifts.length > 0,
  );

  // For override, include users who might have had shifts removed (not in byUser)
  if (isOverride) {
    const missingIds = userIds.filter((id) => !byUser[id]);
    if (missingIds.length) {
      const { data: missingUsers } = await db
        .from("users")
        .select("id, name, email, nickname")
        .in("id", missingIds);

      (missingUsers ?? []).forEach((u) => {
        entries.push([
          u.id,
          { name: u.nickname ?? u.name, email: u.email, shifts: [] },
        ]);
      });
    }
  }

  if (!entries.length) return 0;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const weekLabel = format(new Date(weekStart), "MMM d");

  const results = await Promise.all(
    entries.map(([, { name, email, shifts: userShifts }]) => {
      const days = buildDaysArray(weekStart, userShifts);
      const subject = isOverride
        ? `Schedule updated — week of ${weekLabel}`
        : `Your schedule — week of ${weekLabel}`;

      return resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject,
        react: ScheduleEmail({ name, weekStart, days, isOverride }),
      });
    }),
  );

  return results.filter((r) => !r.error).length;
}
