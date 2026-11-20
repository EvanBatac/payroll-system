import { isRealDate } from "./dates.js";

const lastDayOfMonth = (year, month) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export const isValidSemiMonthlyPeriod = (periodStart, periodEnd) => {
  // Both dates must be valid YYYY-MM-DD dates
  if (!isRealDate(periodStart) || !isRealDate(periodEnd)) {
    return false;
  }

  // Both dates must belong to the same year and month
  if (periodStart.slice(0, 7) !== periodEnd.slice(0, 7)) {
    return false;
  }

  const startDay = Number(periodStart.slice(8, 10));
  const endDay = Number(periodEnd.slice(8, 10));

  const year = Number(periodStart.slice(0, 4));
  const month = Number(periodStart.slice(5, 7));

  const lastDay = lastDayOfMonth(year, month);

  // First half: 1st to 15th
  const isFirstHalf = startDay === 1 && endDay === 15;

  // Second half: 16th to the last day of the month
  const isSecondHalf = startDay === 16 && endDay === lastDay;

  return isFirstHalf || isSecondHalf;
};
