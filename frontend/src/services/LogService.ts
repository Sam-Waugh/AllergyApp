import ApiService from './ApiService';
import { DailyLog, DailyLogForm, Child, ApiResponse, PaginatedResponse } from '../models';

class LogService {  // Submit daily health log
  async createLog(childId: string, logData: DailyLogForm): Promise<ApiResponse<DailyLog>> {
    return ApiService.post<DailyLog>('/logs/', {
      child_id: childId,
      ...logData,
      date: new Date().toISOString().split('T')[0],
    });
  }
  // Get logs for a child
  async getChildLogs(
    childId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<PaginatedResponse<DailyLog>>> {
    const params = {
      page,
      limit,
      start_date: startDate,
      end_date: endDate,
    };

    return ApiService.get<PaginatedResponse<DailyLog>>(`/logs/child/${childId}`, params);
  }  // Get specific log by ID
  async getLog(logId: string): Promise<ApiResponse<DailyLog>> {
    return ApiService.get<DailyLog>(`/logs/${logId}`);
  }

  // Update existing log
  async updateLog(logId: string, logData: Partial<DailyLogForm>): Promise<ApiResponse<DailyLog>> {
    return ApiService.put<DailyLog>(`/logs/${logId}`, logData);
  }

  // Delete log
  async deleteLog(logId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/logs/${logId}`);
  }
  // Get symptom trends for a child
  async getSymptomTrends(
    childId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Record<string, number[]>>> {
    return ApiService.get<Record<string, number[]>>(`/logs/child/${childId}/trends`, {
      start_date: startDate,
      end_date: endDate,
    });
  }
  // Get trigger frequency analysis
  async getTriggerAnalysis(
    childId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Record<string, number>>> {
    return ApiService.get<Record<string, number>>(`/logs/child/${childId}/triggers`, {
      start_date: startDate,
      end_date: endDate,
    });
  }
}

export default new LogService();
