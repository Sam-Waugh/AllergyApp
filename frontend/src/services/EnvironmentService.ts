import ApiService from './ApiService';
import { WeatherData, ResearchArticle, DoctorReport, AIReportResponse, ApiResponse, PaginatedResponse } from '../models';
import * as Location from 'expo-location';

class EnvironmentService {
  // Get environmental data for location
  async getEnvironmentData(location: string): Promise<ApiResponse<WeatherData>> {
    const response = await ApiService.get<any>(`/environment/${location}`);
    return {
      ...response,
      data: response.data ? this.transformEnvironmentData(response.data) : undefined
    };
  }

  // Get current location weather/pollen data using coordinates
  async getCurrentEnvironmentData(lat: number, lon: number): Promise<ApiResponse<WeatherData>> {
    const response = await ApiService.get<any>('/environment/current', { lat, lon });
    return {
      ...response,
      data: response.data ? this.transformEnvironmentData(response.data) : undefined
    };
  }

  // Get current location environment data using public endpoint (for testing)
  async getCurrentEnvironmentDataPublic(lat: number, lon: number): Promise<ApiResponse<WeatherData>> {
    const response = await ApiService.get<any>('/environment/public/current', { lat, lon });
    return {
      ...response,
      data: response.data ? this.transformEnvironmentData(response.data) : undefined
    };
  }  // Get user's current location using Expo Location API
  async getCurrentLocation(): Promise<{ lat: number; lon: number }> {
    try {
      console.log('📍 Requesting location permissions...');
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        throw new Error('Location permission denied');
      }
      
      console.log('✅ Location permission granted, getting position...');

      // Get current position with options for better reliability
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 Got user location:', location.coords.latitude, location.coords.longitude);
      
      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };
    } catch (error) {
      console.error('❌ Location error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new Error('Location permission denied');
        } else if (error.message.includes('timeout')) {
          throw new Error('Location request timed out');
        } else if (error.message.includes('unavailable')) {
          throw new Error('Location services unavailable');
        }
      }
      
      throw new Error(`Failed to get location: ${error}`);
    }
  }

  // Transform backend response to frontend WeatherData format
  private transformEnvironmentData(data: any): WeatherData {
    return {
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      temperature: data.temperature,
      humidity: data.humidity,
      airQuality: data.air_quality_index,
      uvIndex: data.uv_index,
      description: data.weather_conditions,
      pollenCount: data.pollen_count,      pollenData: data.pollen_data,      dailyPollenInfo: data.daily_pollen_info?.map((forecast: any) => ({
        date: forecast.date,
        dayName: this.getDayName(forecast.date),
        overallIndex: forecast.overall_index || 0,
        dominantPollen: forecast.pollen_types?.reduce((prev: any, current: any) => 
          (current.index_value > (prev?.index_value || 0)) ? current : prev
        )?.display_name || 'None',
        pollenTypes: forecast.pollen_types?.map((pollen: any) => ({
          code: pollen.code,
          displayName: pollen.display_name,
          indexValue: pollen.index_value,
          category: pollen.category,
          color: pollen.color,
          inSeason: pollen.in_season,
          severityLevel: this.getSeverityLevel(pollen.index_value),
          healthImpact: this.getHealthImpact(pollen.category)
        })) || []
      })) || [],
      plantDescriptions: data.plant_description
    };
  }

  // Helper method to get day name from date string
  private getDayName(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }

  // Helper method to get severity level from index value
  private getSeverityLevel(indexValue: number): string {
    if (indexValue === 0) return 'None';
    if (indexValue <= 1) return 'Very Low';
    if (indexValue <= 2) return 'Low';
    if (indexValue <= 3) return 'Moderate';
    if (indexValue <= 4) return 'High';
    return 'Very High';
  }

  // Helper method to get health impact from category
  private getHealthImpact(category: string): string[] {
    switch (category.toUpperCase()) {
      case 'NONE':
      case 'VERY_LOW':
        return ['Minimal symptoms expected', 'Safe for outdoor activities'];
      case 'LOW':
        return ['Mild symptoms possible', 'Generally safe outdoors'];
      case 'MODERATE':
        return ['Moderate symptoms possible', 'Limit outdoor time if sensitive'];
      case 'HIGH':
        return ['Significant symptoms likely', 'Avoid prolonged outdoor exposure'];
      case 'VERY_HIGH':
        return ['Severe symptoms expected', 'Stay indoors if possible'];
      default:
        return ['Monitor symptoms', 'Take precautions as needed'];
    }
  }

  // Helper method to get pollen risk level for specific allergens
  getPollenRiskForAllergen(weatherData: WeatherData, allergen: string): string {
    if (!weatherData.dailyPollenInfo || weatherData.dailyPollenInfo.length === 0) {
      return 'unknown';
    }

    const todayPollen = weatherData.dailyPollenInfo[0];
    const relevantPollen = todayPollen.pollenTypes.find(pollen => 
      pollen.code.toLowerCase().includes(allergen.toLowerCase()) ||
      pollen.displayName.toLowerCase().includes(allergen.toLowerCase())
    );

    if (relevantPollen) {
      return relevantPollen.category.toLowerCase();
    }

    return 'unknown';
  }

  // Get overall pollen risk level for today
  getOverallPollenRisk(weatherData: WeatherData): string {
    if (!weatherData.dailyPollenInfo || weatherData.dailyPollenInfo.length === 0) {
      return weatherData.pollenCount || 'moderate';
    }

    const todayPollen = weatherData.dailyPollenInfo[0];
    if (todayPollen.pollenTypes.length === 0) {
      return 'low';
    }

    const maxRisk = Math.max(...todayPollen.pollenTypes.map(p => p.indexValue));
    
    if (maxRisk <= 1) return 'low';
    if (maxRisk <= 3) return 'moderate';
    return 'high';
  }
}

class ResearchService {
  // Get AI-summarized research articles
  async getResearchFeed(
    page: number = 1,
    limit: number = 10,
    conditions?: string[]
  ): Promise<ApiResponse<PaginatedResponse<ResearchArticle>>> {
    const params = {
      page,
      limit,
      conditions: conditions?.join(','),
    };

    return ApiService.get<PaginatedResponse<ResearchArticle>>('/research/feed', params);
  }

  // Get article by ID
  async getArticle(articleId: number): Promise<ApiResponse<ResearchArticle>> {
    return ApiService.get<ResearchArticle>(`/research/${articleId}`);
  }

  // Search articles
  async searchArticles(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ResearchArticle>>> {
    return ApiService.get<PaginatedResponse<ResearchArticle>>('/research/search', {
      q: query,
      page,
      limit,
    });
  }
}

class ReportService {
  // Generate AI-powered doctor report using Firestore
  async generateDoctorReport(
    childId: number | string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<AIReportResponse>> {
    return ApiService.post<AIReportResponse>('/reports/generate-firestore', {
      child_id: childId,
      start_date: startDate,
      end_date: endDate,
      include_photos: false,
      report_type: 'comprehensive'
    });
  }

  // Get existing reports
  async getReports(childId: number): Promise<ApiResponse<DoctorReport[]>> {
    return ApiService.get<DoctorReport[]>(`/reports/child/${childId}`);
  }

  // Download report as PDF
  async downloadReportPDF(reportId: number): Promise<ApiResponse<string>> {
    return ApiService.get<string>(`/reports/${reportId}/pdf`);
  }

  // Email report to doctor
  async emailReport(reportId: number, email: string): Promise<ApiResponse<void>> {
    return ApiService.post<void>(`/reports/${reportId}/email`, { email });
  }
}

// Export service instances
export const environmentService = new EnvironmentService();
export const researchService = new ResearchService();
export const reportService = new ReportService();
