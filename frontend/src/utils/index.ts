// Date utility functions
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString();
};

export const getDateRange = (days: number): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export const isToday = (date: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Data formatting utilities
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getSeverityColor = (severity: number): string => {
  if (severity <= 3) return '#4CAF50'; // Green
  if (severity <= 6) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

export const getSeverityLabel = (severity: number): string => {
  if (severity <= 3) return 'Mild';
  if (severity <= 6) return 'Moderate';
  return 'Severe';
};

// Storage utilities (for later implementation with AsyncStorage)
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    // In real implementation, use AsyncStorage
    console.log(`Storing ${key}:`, value);
  } catch (error) {
    console.error('Error storing data:', error);
  }
};

export const getData = async (key: string): Promise<any> => {
  try {
    // In real implementation, use AsyncStorage
    console.log(`Getting ${key}`);
    return null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};
