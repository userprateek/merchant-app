export type TimestampISO = string;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function toValidDate(input: Date | string | number) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_TIMESTAMP");
  }
  return date;
}

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

export function toTimestampISO(input: Date | string | number): TimestampISO {
  return toValidDate(input).toISOString();
}

export function formatDate(input: Date | string | number): string {
  const date = toValidDate(input);
  const day = pad2(date.getDate());
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateTime(input: Date | string | number): string {
  const date = toValidDate(input);
  const day = pad2(date.getDate());
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  const hours24 = date.getHours();
  const minutes = pad2(date.getMinutes());
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const hours = pad2(hours12);

  return `${day}-${month}-${year} ${hours}:${minutes} ${meridiem}`;
}
