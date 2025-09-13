import { startOfMonth, endOfMonth } from "date-fns";

export function visibleRange(date: Date) {
  return { from: startOfMonth(date), to: endOfMonth(date) };
}
