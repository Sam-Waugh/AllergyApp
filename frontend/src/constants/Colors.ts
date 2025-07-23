// Symply Allergy Brand Colors
export const Colors = {
  // Primary Brand Colors - Teal
  primary: '#4A9B9B',        // Symply Teal - main brand color  
  primaryLight: '#66B2B2',   // Lighter teal for hover states
  primaryDark: '#358585',    // Darker teal for pressed states
  
  // Secondary Colors - Coral
  secondary: '#FF7F7F',      // Symply Coral - accent color
  secondaryLight: '#FF9999', // Light coral
  secondaryDark: '#FF6565',  // Dark coral
  
  // Neutral Colors
  background: '#F8FAFC',     // Light background
  surface: '#FFFFFF',        // Card/surface color
  surfaceVariant: '#F1F5F9', // Alternative surface
  
  // Text Colors
  textPrimary: '#1E293B',    // Primary text (dark)
  textSecondary: '#64748B',  // Secondary text (gray)
  textTertiary: '#94A3B8',   // Tertiary text (light gray)
  textOnPrimary: '#FFFFFF',  // Text on primary color
  
  // Status Colors
  success: '#10B981',        // Green for success states
  warning: '#F59E0B',        // Amber for warnings
  error: '#EF4444',          // Red for errors
  info: '#4A9B9B',           // Teal for info (brand aligned)
  
  // Border Colors
  border: '#E2E8F0',         // Default border
  borderLight: '#F1F5F9',    // Light border
  borderDark: '#CBD5E1',     // Darker border
  
  // Legacy - for gradual migration
  old_primary: '#1976D2',    // Old blue color - to be replaced
};

// Brand gradients
export const Gradients = {
  primary: ['#4A9B9B', '#66B2B2'],    // Teal gradient
  secondary: ['#FF7F7F', '#FF9999'],  // Coral gradient  
  accent: ['#4A9B9B', '#FF7F7F'],     // Teal to coral gradient
};

export default Colors;
