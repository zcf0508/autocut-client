/** like 2.304000 -> 00:00:02.304 */
export function secondToTimestamp(time: string | number): string {
  const [second, millisecond] = `${time}`.split(".")
  const date = new Date(0)
  date.setSeconds(+second)
  return date.toISOString().substr(11, 8).replace("T", "").replace("Z", "") + "." + millisecond.slice(0, 3)
}

/** 00:00:02,304 -> 2.304000 */
export function timestampToSecond(timestamp: string): number {
  const [hours, minutes, _seconds] = timestamp.split(":");
  const seconds = _seconds.split(",")[0];
  const milliseconds = _seconds.split(",")[1];

  const totalSeconds = +hours * 3600 + +minutes * 60 + +seconds;
  const fractionalSeconds = +milliseconds / 1000;

  return totalSeconds + fractionalSeconds;
}