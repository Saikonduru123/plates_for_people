// Format date to YYYY-MM-DD
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Format time to HH:MM
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
};

// Format datetime for display
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date for display (e.g., "Jan 15, 2026")
export const formatDisplayDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time for display (e.g., "2:30 PM")
export const formatDisplayTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Check if date is today
export const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

// Check if date is in the past
export const isPast = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

// Get date range (start to end)
export const getDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDisplayDate(d);
};
