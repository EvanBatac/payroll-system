const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function countOpenDays(startText, endText, openDays) {
  let count = 0;
  const cursor = new Date(`${startText}T00:00:00Z`);
  const last = new Date(`${endText}T00:00:00Z`);

  while (cursor <= last) {
    if (openDays.includes(DAY_NAMES[cursor.getUTCDay()])) {
      count++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1); // move to the next day
  }

  return count;
}