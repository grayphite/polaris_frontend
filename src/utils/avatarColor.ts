/**
 * Generates a consistent color for a user avatar based on their ID
 * Uses a simple hash function to ensure the same user always gets the same color
 */
export function getAvatarColor(userId: number | string): string {
  // Convert userId to string and create a simple hash
  const idString = userId.toString();
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    const char = idString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get a consistent index
  const colorIndex = Math.abs(hash) % 10;
  
  // Predefined color palette with good contrast
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  return colors[colorIndex];
}

/**
 * Generates initials from first name and last name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';
  
  if (first && last) {
    return `${first}${last}`;
  }
  if (first) {
    return first;
  }
  if (last) {
    return last;
  }
  return 'U'; // Default fallback
}

