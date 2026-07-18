interface DashboardSummaryProps {
  streak: number;
  days: number;
  goal: string;
  hasCheckIns: boolean;
  focusMessage: string;
}

export function DashboardSummary({
  streak,
  days,
  goal,
  hasCheckIns,
  focusMessage,
}: DashboardSummaryProps) {
  return (
    <section className="summary" aria-label="Your progress">
      <div>
        <span>{streak}</span>
        <p>day resist streak<br />{hasCheckIns ? 'based on your check-ins' : 'log a check-in to begin'}</p>
      </div>
      <div>
        <span>{days}</span>
        <p>days since you started<br />{goal}</p>
      </div>
      <div>
        <strong>Today’s focus</strong>
        <p>{focusMessage}</p>
      </div>
    </section>
  );
}
