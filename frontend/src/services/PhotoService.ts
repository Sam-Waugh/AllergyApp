import ApiService from './ApiService';
import { PhotoEntry, ApiResponse, PaginatedResponse } from '../models';

class PhotoService {  // Upload photo with description
  async uploadPhoto(
    childId: number,
    photoUri: string,
    description: string,
    tags: string[] = [],
    bodyPart?: string,
    severity?: number,
    logId?: number
  ): Promise<ApiResponse<PhotoEntry>> {
    const formData = new FormData();
    formData.append('child_id', childId.toString());
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tags));
    
    if (bodyPart) formData.append('body_part', bodyPart);
    if (severity) formData.append('severity', severity.toString());
    if (logId) formData.append('log_id', logId.toString());

    // Handle photo file
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    return ApiService.post<PhotoEntry>('/photos/', formData);
  }
  // Get photos for a child
  async getChildPhotos(
    childId: number,
    page: number = 1,
    limit: number = 20,
    tags?: string[]
  ): Promise<ApiResponse<PaginatedResponse<PhotoEntry>>> {
    const params = {
      page,
      limit,
      tags: tags?.join(','),
    };

    return ApiService.get<PaginatedResponse<PhotoEntry>>(`/photos/child/${childId}`, params);
  }

  // Get photos for a specific log
  async getLogPhotos(logId: number): Promise<ApiResponse<PhotoEntry[]>> {
    return ApiService.get<PhotoEntry[]>(`/photos/log/${logId}`);
  }

  // Update photo details
  async updatePhoto(
    photoId: number,
    updates: {
      description?: string;
      tags?: string[];
      bodyPart?: string;
      severity?: number;
    }
  ): Promise<ApiResponse<PhotoEntry>> {
    return ApiService.put<PhotoEntry>(`/photos/${photoId}`, updates);
  }

  // Delete photo
  async deletePhoto(photoId: number): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/photos/${photoId}`);
  }

  // Get photos by tags
  async getPhotosByTags(
    childId: number,
    tags: string[],
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<PhotoEntry>>> {
    return ApiService.get<PaginatedResponse<PhotoEntry>>(`/photos/child/${childId}/tags`, {
      tags: tags.join(','),
      page,
      limit,
    });
  }
}

export default new PhotoService();
