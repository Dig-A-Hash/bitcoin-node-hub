export function truncateNodeString(str: string): string {
  if (!str || str.length <= 13) return str;
  return `${str.slice(0, 8)}...${str.slice(-5)}`;
}
