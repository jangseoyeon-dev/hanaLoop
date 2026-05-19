export function rowHash8(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

export function buildRowHashKey(
  activityDate: string,
  typeCode: string,
  description: string,
): string {
  return `${activityDate}|${typeCode}|${description}`;
}
