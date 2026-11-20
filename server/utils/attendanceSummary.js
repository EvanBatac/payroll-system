import { DAY_NAMES } from "./workDays.js";

export const summarizeAttendance = ({
  periodStart,
  periodEnd,
  workDays,
  attendance,
  leaves,
}) => {
  const attendanceByDate = new Map(
    attendance.map((record) => [record.date, record]),
  );

  const cursor = new Date(`${periodStart}T00:00:00Z`);
  const last = new Date(`${periodEnd}T00:00:00Z`);

  let scheduledDays = 0;
  let daysWorked = 0;
  let absentDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let lateMinutes = 0;

  while (cursor <= last) {
    const dateText = cursor.toISOString().slice(0, 10);
    const dayName = DAY_NAMES[cursor.getUTCDay()];

    // Ignore dates that aren't scheduled work days.
    if (workDays.includes(dayName)) {
      scheduledDays++;

      // Check whether an approved leave covers this date.
      const leave = leaves.find(
        (item) => item.startDate <= dateText && dateText <= item.endDate,
      );

      // Leave takes precedence over attendance.
      if (leave) {
        if (leave.isPaid) {
          paidLeaveDays++;
        } else {
          unpaidLeaveDays++;
        }
      } else {
        const record = attendanceByDate.get(dateText);

        if (!record) {
          absentDays++;
        } else {
          switch (record.status) {
            case "present":
              daysWorked++;
              break;

            case "late":
              daysWorked++;
              lateMinutes += record.lateMinutes;
              break;

            case "half_day":
              daysWorked += 0.5;
              absentDays += 0.5;
              break;

            case "absent":
              absentDays++;
              break;

            default:
              throw new Error(`Unknown attendance status: ${record.status}`);
          }
        }
      }
    }

    // Move to the next calendar date using UTC.
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    scheduledDays,
    daysWorked,
    absentDays,
    paidLeaveDays,
    unpaidLeaveDays,
    lateMinutes,
  };
};
