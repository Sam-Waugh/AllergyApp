import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseService } from '../services/firebaseService';
import { ModernButton } from '../components/modern';

interface PhotoReportProps {
  childId: string;
  dateRange?: { start: string; end: string };
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function PhotoReport({ childId, dateRange, onClose }: PhotoReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, [childId, dateRange]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const medicalReport = await firebaseService.createMedicalReport(childId, dateRange);
      setReport(medicalReport);
    } catch (error) {
      console.error('Failed to generate report:', error);
      Alert.alert('Error', 'Failed to generate medical report');
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    if (!report) return;

    try {
      const reportText = `
Medical Report for Child
Generated: ${new Date(report.generated_at).toLocaleDateString()}
Period: ${report.summary.date_range_days} days

Summary:
- Total symptom logs: ${report.summary.total_logs}
- Total photos: ${report.summary.total_photos}

Daily Logs:
${report.daily_logs.map((log: any, index: number) => `
${index + 1}. ${log.date}
   Symptoms: ${Object.entries(log.symptoms).filter(([, value]) => (value as number) > 0).map(([key, value]) => `${key}: ${value}`).join(', ')}
   Mood: ${log.mood}/5
   Triggers: ${log.triggers.join(', ')}
   ${log.notes ? `Notes: ${log.notes}` : ''}
`).join('')}

Photos Available:
${report.photo_references.map((photo: any, index: number) => `
${index + 1}. ${photo.description || 'Photo'} (${photo.body_area || 'No location specified'})
   Severity: ${photo.severity_rating}/5
   Date: ${new Date(photo.taken_at).toLocaleDateString()}
`).join('')}

Note: Photos are stored locally on this device for privacy. To share photos with healthcare providers, please show them directly from this app or save them separately.
      `;

      await Share.share({
        message: reportText,
        title: 'Medical Report'
      });
    } catch (error) {
      console.error('Failed to share report:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Generating Report...</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Not Available</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Report</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Summary</Text>
          <Text style={styles.text}>Generated: {new Date(report.generated_at).toLocaleDateString()}</Text>
          <Text style={styles.text}>Period: {report.summary.date_range_days} days</Text>
          <Text style={styles.text}>Total Logs: {report.summary.total_logs}</Text>
          <Text style={styles.text}>Total Photos: {report.summary.total_photos}</Text>
        </View>

        {/* Photos Section */}
        {report.photo_references.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({report.photo_references.length})</Text>
            <Text style={styles.subtitle}>
              Photos are stored locally on your device for privacy. Show these directly to healthcare providers.
            </Text>
            
            <View style={styles.photosGrid}>
              {report.photo_references.map((photo: any, index: number) => (
                <View key={photo.photo_id} style={styles.photoItem}>
                  <Image 
                    source={{ uri: photo.local_uri }} 
                    style={styles.photoImage}
                    onError={() => console.log('Failed to load photo:', photo.local_uri)}
                  />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoDescription}>
                      {photo.description || `Photo ${index + 1}`}
                    </Text>
                    {photo.body_area && (
                      <Text style={styles.photoDetail}>Location: {photo.body_area}</Text>
                    )}
                    <Text style={styles.photoDetail}>
                      Severity: {photo.severity_rating}/5
                    </Text>
                    <Text style={styles.photoDetail}>
                      Date: {new Date(photo.taken_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Symptom Logs</Text>
          {report.daily_logs.slice(0, 10).map((log: any, index: number) => (
            <View key={log.id} style={styles.logItem}>
              <Text style={styles.logDate}>{log.date}</Text>
              <Text style={styles.logSymptoms}>
                Symptoms: {Object.entries(log.symptoms).filter(([, value]) => (value as number) > 0)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ') || 'None'}
              </Text>
              <Text style={styles.logDetail}>Mood: {log.mood}/5</Text>
              {log.triggers.length > 0 && (
                <Text style={styles.logDetail}>Triggers: {log.triggers.join(', ')}</Text>
              )}
              {log.notes && (
                <Text style={styles.logNotes}>Notes: {log.notes}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <ModernButton
            title="Share Report"
            variant="primary"
            onPress={shareReport}
            style={styles.shareButton}
          />
          <Text style={styles.disclaimer}>
            This report contains medical information. Photos remain on your device for privacy and security.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  photosGrid: {
    gap: 16,
  },
  photoItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  photoInfo: {
    flex: 1,
  },
  photoDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  photoDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  logItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logSymptoms: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  logDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  logNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    paddingVertical: 16,
  },
  shareButton: {
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
