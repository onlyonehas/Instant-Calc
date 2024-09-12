export const getDaysLeft = (monthlyPayDate: number) => {
  const today: any = new Date();
  const date = today.getDate();
  const daysLeft = monthlyPayDate - date;
  const nextPayDate = new Date(today.setDate(date + daysLeft));

  if (daysLeft < 0) {
    nextPayDate.setMonth(today.getMonth() + 1);
  }

  const day = new Date(nextPayDate).getDay();

  let minusWeekend = 0;
  if (day === 6) {
    minusWeekend -= 1;
  } else if (day === 0) {
    minusWeekend -= 2;
  }

  nextPayDate.setDate(nextPayDate.getDate() + minusWeekend);

  const diffInMs = new Date(nextPayDate).valueOf() - new Date().valueOf();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  // const nextDate = nextPayDate.toLocaleDateString("en-GB")
  const nextPayMsg = `Next pay in ${diffInDays} Days`;
  return nextPayMsg;
};
