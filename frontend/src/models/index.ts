// Core data models for the Allergy App

// Enums and types
export type SymptomSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface Child {
  id: string; // Firestore document ID
  name: string;
  dateOfBirth: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  childId: string;
  date: string;
  symptoms: {
    rash: number; // 0-10 scale
    cough: number;
    runnyNose: number;
    itching: number;
    wheezing: number;
  };
  mood: number; // 1-5 scale
  triggers: string[];
  notes: string;
  weather?: WeatherData;
  location?: string;
  createdAt: string;
}

export interface PhotoEntry {
  id: string;
  childId: string;
  logId?: string;
  photoUrl: string;
  description: string;
  tags: string[];
  bodyPart?: string;
  severity?: number;
  createdAt: string;
}

export interface PollenTypeData {
  code: string;
  displayName: string;
  indexValue: number;
  category: 'NONE' | 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  color: {
    red: number;
    green: number;
    blue: number;
  };
  inSeason: boolean;
  healthRecommendations?: string[];
  healthImpact?: string;
  severityLevel?: number;
  plantInfo?: {
    family?: string;
    season?: string;
    specialColors?: any;
    specialShapes?: any;
    crossReaction?: string;
    picture?: string;
  };
}

export interface DailyPollenForecast {
  date: string;
  dayName: string;
  pollenTypes: PollenTypeData[];
  overallIndex: number;
  dominantPollen: string;
}

export interface PollenSummary {
  todayDominant: string;
  todayIndex: number;
  forecastDays: number;
  peakDay: string;
}

export interface HeatmapTile {
  url: string;
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
}

export interface HeatmapTileInfo {
  displayName: string;
  mainTile: {
    url: string;
    x: number;
    y: number;
  };
  surroundingTiles: HeatmapTile[];
  tileTemplate: string;
}

export interface PollenHeatmapData {
  center: {
    lat: number;
    lon: number;
    zoom: number;
  };
  tiles: {
    tree_upi?: HeatmapTileInfo;
    grass_upi?: HeatmapTileInfo;
    weed_upi?: HeatmapTileInfo;
  };
}

// Legacy compatibility
export interface PollenForecast {
  date: string;
  pollenTypes: PollenTypeData[];
}

export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  airQuality: number;
  uvIndex: number;
  description: string;
  
  // Enhanced pollen data from Google Maps API
  pollenData?: any;
  dailyPollenInfo?: DailyPollenForecast[];
  plantDescriptions?: any[];
  regionCode?: string;
  pollenSummary?: PollenSummary;
  heatmapTiles?: PollenHeatmapData;
  
  // Legacy field for backward compatibility
  pollenCount: string;
  
  // Future enhancements
  weatherForecast?: any[];
  airQualityForecast?: any[];
}

export interface ResearchArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  relevantConditions: string[];
  publishedAt: string;
  aiSummary?: string;
}

export interface DoctorReport {
  id: string;
  childId: string;
  dateRange: {
    start: string;
    end: string;
  };
  logs: DailyLog[];
  photos: PhotoEntry[];
}

export interface AIReportResponse {
  success: boolean;
  report_text?: string;
  error_message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  children: Child[];
  preferences: {
    notifications: boolean;
    reminderTime: string;
    defaultLocation: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

// Navigation types
export type RootStackParamList = {
  TabNavigator: undefined;
  Home: undefined;
  DailyLog: { childId: string };
  ImageDiary: { childId: string };
  Profile: { childId?: string };
  Research: undefined;
  Pollen: undefined;
  DoctorReport: { childId: string };
  Settings: undefined;
  ManageChildren: undefined;
  AddChild: { onChildAdded?: () => void };
};

// Form types
export interface DailyLogForm {
  symptoms: {
    rash: number;
    cough: number;
    runnyNose: number;
    itching: number;
    wheezing: number;
  };
  mood: number;
  triggers: string[];
  notes: string;
}

export interface ProfileForm {
  name: string;
  dateOfBirth: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
}
