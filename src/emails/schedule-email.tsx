import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Row,
  Column,
  Hr,
  Tailwind,
} from "@react-email/components";
import { format, parseISO, addDays } from "date-fns";

interface ScheduleEmailProps {
  name: string | null;
  weekStart: string;
  days: { date: string; type: "full" | "half" | null }[];
  isOverride: boolean;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const typeClasses = {
  full: "text-pink-700 bg-pink-100",
  half: "text-amber-700 bg-amber-100",
  off: "text-gray-500 bg-gray-100",
} as const;

export default function ScheduleEmail({
  name,
  weekStart,
  days,
  isOverride,
}: ScheduleEmailProps) {
  const weekLabel = format(parseISO(weekStart), "MMM d");
  const greeting = name ? `Hi ${name},` : "Hi,";
  const header = isOverride
    ? `Your schedule has been updated for the week of ${weekLabel}.`
    : `Here's your schedule for the week of ${weekLabel}.`;

  return (
    <Html>
      <Head />
      <Preview>{header}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-150 p-5">
            <Text className="mb-1 text-base">{greeting}</Text>
            <Text className="mt-0 text-base">{header}</Text>

            <Section className="mt-6">
              <Row>
                {days.map((day, i) => {
                  const classes = day.type
                    ? typeClasses[day.type]
                    : typeClasses.off;
                  const label = day.type ?? "off";
                  return (
                    <Column key={day.date} className="px-1 text-center">
                      <Text className="mb-1 text-xs font-semibold text-gray-700">
                        {DAY_NAMES[i]}
                      </Text>
                      <Text
                        className={`rounded-md px-1 py-1.5 text-[13px] font-medium ${classes}`}
                      >
                        {label}
                      </Text>
                    </Column>
                  );
                })}
              </Row>
            </Section>

            <Hr className="mt-8 border-gray-200" />
            <Text className="text-xs text-gray-400">
              This is an automated message from ShiftBoard.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/** Helper to build the 7-day array from shift data for a given user + week. */
export function buildDaysArray(
  weekStart: string,
  shifts: { date: string; type: "full" | "half" | null }[],
): ScheduleEmailProps["days"] {
  const shiftMap = Object.fromEntries(shifts.map((s) => [s.date, s.type]));
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(addDays(parseISO(weekStart), i), "yyyy-MM-dd");
    return { date, type: shiftMap[date] ?? null };
  });
}
