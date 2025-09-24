export function useTextFormatting() {
  // Format bytes to human-readable format (e.g., KB, MB)
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  // Format Unix timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format seconds to human-readable days, hours, minutes, seconds
  const formatSecondsToDays = (seconds: number) => {
    if (!seconds || seconds < 0) return '0 seconds';

    // Convert seconds to days (86400 seconds in a day)
    const days = seconds / 86400;

    // Round to 1 decimal place
    const roundedDays = Math.round(days * 10) / 10;

    // Return as string with "days" or "day" based on value
    return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'}`;
  };

  return { formatBytes, formatTimestamp, formatSecondsToDays };
}
