import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Share,
  Platform,
  StatusBar,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { Colors } from '../constants/Colors';
import {
  TopBar,
  ModernButton,
  Avatar,
  MetricCard,
  Chip,
} from '../components/modern';

interface ChildData {
  child_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  age_months: number;
}

interface DailyLog {
  id: string;
  date: string;
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

export default function ModernDoctorReportScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'1month' | '3months' | '6months'>('3months');

  const selectedChild = children.find(child => child.child_id === selectedChildId);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadDailyLogs();
    }
  }, [selectedChildId, reportPeriod]);

  const loadChildren = async () => {
    if (!user) return;
    
    try {
      const childrenData = await firebaseService.getUserChildren();
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].child_id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load child profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyLogs = async () => {
    if (!selectedChildId) return;

    try {
      const logs = await firebaseService.getChildDailyLogs(selectedChildId, 100);
      
      // Filter logs based on selected period
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (reportPeriod) {
        case '1month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
      }

      const filteredLogs = logs.filter(log => new Date(log.date) >= cutoffDate);
      setDailyLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading daily logs:', error);
      Alert.alert('Error', 'Failed to load symptom logs');
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInMs = today.getTime() - birth.getTime();
    const years = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor((ageInMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (years > 0) {
      return `${years} years, ${months} months`;
    }
    return `${months} months`;
  };

  const calculateSymptomStats = () => {
    if (dailyLogs.length === 0) {
      return {
        totalLogs: 0,
        avgRash: 0,
        avgCough: 0,
        avgRunnyNose: 0,
        avgItching: 0,
        avgWheezing: 0,
        mostCommonTriggers: [],
        severeDays: 0,
        mildDays: 0
      };
    }

    const totalLogs = dailyLogs.length;
    let totalRash = 0, totalCough = 0, totalRunnyNose = 0, totalItching = 0, totalWheezing = 0;
    const triggerCounts: { [key: string]: number } = {};
    let severeDays = 0, mildDays = 0;

    dailyLogs.forEach(log => {
      totalRash += log.symptoms.rash;
      totalCough += log.symptoms.cough;
      totalRunnyNose += log.symptoms.runnyNose;
      totalItching += log.symptoms.itching;
      totalWheezing += log.symptoms.wheezing;

      // Count triggers
      log.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });

      // Calculate severity
      const maxSeverity = Math.max(
        log.symptoms.rash,
        log.symptoms.cough,
        log.symptoms.runnyNose,
        log.symptoms.itching,
        log.symptoms.wheezing
      );

      if (maxSeverity >= 4) severeDays++;
      else if (maxSeverity <= 2) mildDays++;
    });

    const mostCommonTriggers = Object.entries(triggerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trigger]) => trigger);

    return {
      totalLogs,
      avgRash: (totalRash / totalLogs).toFixed(1),
      avgCough: (totalCough / totalLogs).toFixed(1),
      avgRunnyNose: (totalRunnyNose / totalLogs).toFixed(1),
      avgItching: (totalItching / totalLogs).toFixed(1),
      avgWheezing: (totalWheezing / totalLogs).toFixed(1),
      mostCommonTriggers,
      severeDays,
      mildDays
    };
  };

  const stats = calculateSymptomStats();

  const generateReportText = () => {
    if (!selectedChild) return '';

    const reportDate = new Date().toLocaleDateString();
    const periodText = reportPeriod === '1month' ? '1 month' : reportPeriod === '3months' ? '3 months' : '6 months';

    return `SYMPLY ALLERGY - MEDICAL REPORT

Patient Information:
Name: ${selectedChild.first_name} ${selectedChild.last_name}
Date of Birth: ${new Date(selectedChild.date_of_birth).toLocaleDateString()}
Age: ${calculateAge(selectedChild.date_of_birth)}
Gender: ${selectedChild.gender}
Report Period: ${periodText}
Report Generated: ${reportDate}

Symptom Summary (${periodText}):
Total Symptom Logs: ${stats.totalLogs}

Average Symptom Severity (0-5 scale):
• Skin Rash: ${stats.avgRash}
• Cough: ${stats.avgCough}
• Runny Nose: ${stats.avgRunnyNose}
• Itching: ${stats.avgItching}
• Wheezing: ${stats.avgWheezing}

Severity Analysis:
• Severe Symptom Days: ${stats.severeDays}
• Mild Symptom Days: ${stats.mildDays}
• Moderate Days: ${stats.totalLogs - stats.severeDays - stats.mildDays}

Most Common Triggers:
${stats.mostCommonTriggers.map((trigger, index) => `${index + 1}. ${trigger}`).join('\n')}

This report was generated by Symply Allergy for medical consultation purposes.
Please share with your healthcare provider for comprehensive allergy management.`;
  };

  const handleShareReport = async () => {
    try {
      const reportText = generateReportText();
      await Share.share({
        message: reportText,
        title: `Allergy Report - ${selectedChild?.first_name} ${selectedChild?.last_name}`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handleEmailReport = () => {
    Alert.alert('Email Report', 'Email functionality will be available soon');
  };

  const handleDownloadReport = async () => {
    try {
      if (!selectedChild) {
        Alert.alert('Error', 'No child selected');
        return;
      }

      const reportText = generateReportText();
      const fileName = `SymplyAllergy_Report_${selectedChild.first_name}_${selectedChild.last_name}_${new Date().toISOString().split('T')[0]}.txt`;

      if (Platform.OS === 'web') {
        // Web implementation - create and download file
        const element = document.createElement('a');
        const file = new Blob([reportText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        Alert.alert('Success', 'Report downloaded successfully');
      } else {
        // Mobile implementation using Expo APIs
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, reportText, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Check if sharing is available on the platform
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Save Allergy Report',
          });
        } else {
          Alert.alert('Success', `Report saved as ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <TopBar
          title="Medical Report"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics-outline" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar
        title="Medical Report"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        actions={[
          {
            icon: 'share-outline',
            label: 'Share',
            onPress: handleShareReport,
          },
        ]}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={false}
      >
        {/* Child Selection */}
        {children.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.childrenChips}>
                {children.map((child) => (
                  <Chip
                    key={child.child_id}
                    label={`${child.first_name} ${child.last_name}`}
                    selected={selectedChildId === child.child_id}
                    onPress={() => setSelectedChildId(child.child_id)}
                    style={styles.childChip}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Report Period Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Period</Text>
          <View style={styles.periodChips}>
            {[
              { key: '1month', label: '1 Month' },
              { key: '3months', label: '3 Months' },
              { key: '6months', label: '6 Months' },
            ].map((period) => (
              <Chip
                key={period.key}
                label={period.label}
                selected={reportPeriod === period.key}
                onPress={() => setReportPeriod(period.key as any)}
                style={styles.periodChip}
              />
            ))}
          </View>
        </View>

        {/* Patient Information */}
        {selectedChild && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.patientInfo}>
              <Avatar 
                name={`${selectedChild.first_name} ${selectedChild.last_name}`} 
                size="large" 
              />
              <View style={styles.patientDetails}>
                <Text style={styles.patientName}>
                  {selectedChild.first_name} {selectedChild.last_name}
                </Text>
                <Text style={styles.patientDetail}>
                  Age: {calculateAge(selectedChild.date_of_birth)}
                </Text>
                <Text style={styles.patientDetail}>
                  Gender: {selectedChild.gender}
                </Text>
                <Text style={styles.patientDetail}>
                  DOB: {new Date(selectedChild.date_of_birth).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Symptom Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Logs"
              value={stats.totalLogs.toString()}
              color={Colors.info}
            />
            <MetricCard
              title="Severe Days"
              value={stats.severeDays.toString()}
              color={Colors.error}
            />
            <MetricCard
              title="Mild Days"
              value={stats.mildDays.toString()}
              color={Colors.success}
            />
          </View>
        </View>

        {/* Average Severity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Average Symptom Severity</Text>
          <Text style={styles.sectionSubtitle}>Scale: 0 (None) to 5 (Severe)</Text>
          <View style={styles.symptomList}>
            {[
              { name: 'Skin Rash', value: stats.avgRash, icon: '🔴' },
              { name: 'Cough', value: stats.avgCough, icon: '🔵' },
              { name: 'Runny Nose', value: stats.avgRunnyNose, icon: '💧' },
              { name: 'Itching', value: stats.avgItching, icon: '✋' },
              { name: 'Wheezing', value: stats.avgWheezing, icon: '💨' },
            ].map((symptom, index) => (
              <View key={index} style={styles.symptomItem}>
                <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                <Text style={styles.symptomName}>{symptom.name}</Text>
                <View style={styles.symptomValue}>
                  <Text style={styles.symptomNumber}>{symptom.value}</Text>
                  <View style={[styles.severityBar, { width: `${(parseFloat(symptom.value.toString()) / 5) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Common Triggers */}
        {stats.mostCommonTriggers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Common Triggers</Text>
            <View style={styles.triggersContainer}>
              {stats.mostCommonTriggers.map((trigger, index) => (
                <View key={index} style={styles.triggerItem}>
                  <Text style={styles.triggerRank}>{String(index + 1)}</Text>
                  <Text style={styles.triggerName}>{trigger}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Report Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export & Share</Text>
          <View style={styles.actionsGrid}>
            <ModernButton
              title="Share Report"
              variant="primary"
              onPress={handleShareReport}
              style={styles.actionButton}
            />
            <ModernButton
              title="Email to Doctor"
              variant="secondary"
              onPress={handleEmailReport}
              style={styles.actionButton}
            />
            <ModernButton
              title="Download Report"
              variant="outline"
              onPress={handleDownloadReport}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Report Footer */}
        <View style={styles.footer}>
          <Ionicons name="analytics-outline" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.footerText}>
            Report generated on {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>
            Symply Allergy - For medical consultation purposes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  childrenChips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  childChip: {
    marginRight: 8,
  },
  periodChips: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    flex: 1,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  patientDetails: {
    marginLeft: 16,
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  patientDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  symptomList: {
    gap: 12,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  symptomIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  symptomValue: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  symptomNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  severityBar: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  triggersContainer: {
    gap: 8,
  },
  triggerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  triggerRank: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 12,
    minWidth: 24,
  },
  triggerName: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
});
