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
  TextInput,
  Image,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { Colors } from '../constants/Colors';
import { ChildResponse, DailyLog as DailyLogType, PhotoEntry as PhotoEntryType } from '../models';
import {
  TopBar,
  ModernButton,
  Avatar,
  MetricCard,
  Chip,
} from '../components/modern';

interface ChildData extends ChildResponse {
  allergies?: {
    confirmed: string[];
    suspected: string[];
  };
  medications?: string[];
  family_history?: {
    allergies: string[];
    conditions: string[];
  };
}

interface DailyLog extends DailyLogType {
  photos?: PhotoEntry[];
}

interface PhotoEntry extends PhotoEntryType {
  localUri: string;
}

interface MedicalReport {
  summary: any;
  daily_logs: DailyLog[];
  photo_references: PhotoEntry[];
  ai_insights?: any;
  generated_at: string;
}

export default function ModernDoctorReportScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [medicalReport, setMedicalReport] = useState<MedicalReport | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'1month' | '3months' | '6months'>('3months');
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months ago
    end: new Date().toISOString().split('T')[0]
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [doctorNotes, setDoctorNotes] = useState('');
  const [confirmedAllergies, setConfirmedAllergies] = useState<string[]>([]);
  const [suspectedAllergies, setSuspectedAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);

  const selectedChild = children.find(child => child.child_id === selectedChildId);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadDailyLogs();
      generateComprehensiveReport();
    }
  }, [selectedChildId, selectedDateRange]);

  const loadChildren = async () => {
    if (!user) return;
    
    try {
      const childrenData = await firebaseService.getUserChildren();
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].child_id);
        // Load child-specific data
        const child = childrenData[0];
        setConfirmedAllergies(child.allergies?.confirmed || []);
        setSuspectedAllergies(child.allergies?.suspected || []);
        setMedications(child.medications || []);
        setFamilyHistory(child.family_history?.allergies || []);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load child profiles');
    } finally {
      setLoading(false);
    }
  };

  const generateComprehensiveReport = async () => {
    if (!selectedChildId) return;

    try {
      setReportLoading(true);
      console.log('Generating comprehensive medical report...');
      
      // Generate the medical report with AI insights and deidentification
      const report = await firebaseService.createMedicalReport(selectedChildId, selectedDateRange);
      setMedicalReport(report);
      
      console.log('Medical report generated successfully');
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      Alert.alert('Error', 'Failed to generate comprehensive medical report');
    } finally {
      setReportLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setSelectedDateRange(prev => ({
        ...prev,
        start: selectedDate.toISOString().split('T')[0]
      }));
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setSelectedDateRange(prev => ({
        ...prev,
        end: selectedDate.toISOString().split('T')[0]
      }));
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
        title="Doctor Report"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        actions={[
          {
            icon: 'refresh',
            label: 'Refresh',
            onPress: generateComprehensiveReport,
          },
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
      >
        {/* Profile Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Profile</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipContainer}
            contentContainerStyle={styles.chipContent}
          >
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : children.length > 0 ? (
              children.map((child) => (
                <Chip
                  key={child.child_id}
                  label={child.first_name}
                  selected={selectedChildId === child.child_id}
                  onPress={() => setSelectedChildId(child.child_id)}
                  style={styles.chip}
                />
              ))
            ) : (
              <View style={styles.noChildrenContainer}>
                <Text style={styles.noChildrenText}>No profiles found</Text>
                <ModernButton
                  title="Add First Profile"
                  onPress={() => navigation.navigate('ManageChildren' as never)}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
          </ScrollView>
          
          <Text style={styles.sectionInfo}>
            {selectedChild 
              ? `Generating report for ${selectedChild.first_name}`
              : 'Choose the profile to generate a report for'
            }
          </Text>
        </View>

        {/* Patient Information Header */}
        {selectedChild && (
          <View style={styles.patientHeader}>
            <View style={styles.patientHeaderContent}>
              <Avatar 
                name={`${selectedChild.first_name} ${selectedChild.last_name}`} 
                size="large" 
              />
              <View style={styles.patientHeaderDetails}>
                <Text style={styles.patientHeaderInfo}>
                  Age: {calculateAge(selectedChild.date_of_birth)} • {selectedChild.gender}
                </Text>
                <Text style={styles.patientHeaderInfo}>
                  DOB: {new Date(selectedChild.date_of_birth).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.reportDateContainer}>
              <Text style={styles.reportDate}>
                Report: {new Date().toLocaleDateString()}
              </Text>
              <Text style={styles.reportPeriod}>
                Period: {selectedDateRange.start} to {selectedDateRange.end}
              </Text>
            </View>
          </View>
        )}

        {/* Date Range Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Period</Text>
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>From:</Text>
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.datePickerText}>
                  {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>To:</Text>
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.datePickerText}>
                  {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.generateButton} onPress={generateComprehensiveReport}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
          
          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
              maximumDate={endDate}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
              minimumDate={startDate}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Family History Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family History Overview</Text>
          <View style={styles.familyHistoryContainer}>
            <Text style={styles.familyHistoryLabel}>Known Family Allergies:</Text>
            <View style={styles.chipContainer}>
              {familyHistory.length > 0 ? (
                familyHistory.map((allergy, index) => (
                  <View key={index} style={styles.familyHistoryChip}>
                    <Text style={styles.familyHistoryChipText}>{allergy}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No family history recorded</Text>
              )}
            </View>
          </View>
        </View>

        {/* IgE (Immediate) Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IgE-Mediated (Immediate) Allergies</Text>
          <Text style={styles.sectionSubtitle}>Immediate hypersensitivity reactions (Type I)</Text>
          <View style={styles.allergiesContainer}>
            {confirmedAllergies.length > 0 ? (
              confirmedAllergies.map((allergy, index) => (
                <View key={index} style={styles.igeAllergyItem}>
                  <View style={styles.igeIndicator} />
                  <Text style={styles.allergyName}>{allergy}</Text>
                  <Text style={styles.allergyStatus}>IgE-Mediated</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No IgE-mediated allergies recorded</Text>
            )}
          </View>
        </View>

        {/* Non-IgE (Delayed) Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Non-IgE-Mediated (Delayed) Allergies</Text>
          <Text style={styles.sectionSubtitle}>Delayed hypersensitivity reactions (Type IV)</Text>
          <View style={styles.allergiesContainer}>
            {suspectedAllergies.length > 0 ? (
              suspectedAllergies.map((allergy, index) => (
                <View key={index} style={styles.nonIgeAllergyItem}>
                  <View style={styles.nonIgeIndicator} />
                  <Text style={styles.allergyName}>{allergy}</Text>
                  <Text style={styles.allergyStatus}>Non-IgE-Mediated</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No non-IgE-mediated allergies recorded</Text>
            )}
          </View>
        </View>

        {/* Current Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          <View style={styles.medicationsContainer}>
            {medications.length > 0 ? (
              medications.map((medication, index) => (
                <View key={index} style={styles.medicationItem}>
                  <Ionicons name="medical" size={20} color={Colors.primary} />
                  <Text style={styles.medicationName}>{medication}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No medications recorded</Text>
            )}
          </View>
        </View>

        {/* Allergy Incident Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergy Incident Log</Text>
          {reportLoading ? (
            <Text style={styles.loadingText}>Loading incident data...</Text>
          ) : medicalReport ? (
            <View style={styles.incidentLogContainer}>
              <View style={styles.incidentStats}>
                <MetricCard
                  title="Total Incidents"
                  value={medicalReport.summary?.total_logs?.toString() || '0'}
                  color={Colors.error}
                />
                <MetricCard
                  title="With Photos"
                  value={medicalReport.summary?.total_photos?.toString() || '0'}
                  color={Colors.warning}
                />
                <MetricCard
                  title="Days Tracked"
                  value={medicalReport.summary?.date_range_days?.toString() || '0'}
                  color={Colors.info}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No incident data available</Text>
          )}
        </View>

        {/* Tagged Photo Evidence */}
        {medicalReport?.photo_references && medicalReport.photo_references.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tagged Photo Evidence</Text>
            <Text style={styles.sectionSubtitle}>
              Photos stored locally for privacy. Total: {medicalReport.photo_references.length}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoEvidenceContainer}>
                {medicalReport.photo_references.slice(0, 5).map((photo, index) => (
                  <View key={photo.id || index} style={styles.photoEvidenceItem}>
                    <Image 
                      source={{ uri: photo.localUri }} 
                      style={styles.photoEvidenceImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.photoEvidenceDescription}>
                      {photo.description || 'Symptom Photo'}
                    </Text>
                    <Text style={styles.photoEvidenceDate}>
                      {new Date(photo.takenAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Frequent Symptoms Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequent Symptoms</Text>
          <Text style={styles.sectionSubtitle}>Average severity over report period (0-5 scale)</Text>
          <View style={styles.symptomList}>
            {[
              { name: 'Skin Rash', value: stats.avgRash, icon: '🔴', color: '#FF5722' },
              { name: 'Cough', value: stats.avgCough, icon: '🔵', color: '#2196F3' },
              { name: 'Runny Nose', value: stats.avgRunnyNose, icon: '💧', color: '#00BCD4' },
              { name: 'Itching', value: stats.avgItching, icon: '✋', color: '#FF9800' },
              { name: 'Wheezing', value: stats.avgWheezing, icon: '💨', color: '#9C27B0' },
            ].map((symptom, index) => (
              <View key={index} style={styles.symptomChartItem}>
                <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                <Text style={styles.symptomName}>{symptom.name}</Text>
                <View style={styles.symptomBarContainer}>
                  <View 
                    style={[
                      styles.symptomBar, 
                      { 
                        width: `${(parseFloat(symptom.value.toString()) / 5) * 100}%`,
                        backgroundColor: symptom.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.symptomValue}>{symptom.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI-Generated Medical Summary with Safe Harbor Deidentification */}
        {medicalReport?.ai_insights && (
          <View style={styles.section}>
            <View style={styles.aiSectionHeader}>
              <View style={styles.aiTitleContainer}>
                <Ionicons name="analytics-outline" size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>AI Medical Analysis</Text>
              </View>
              <View style={styles.privacyBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                <Text style={styles.privacyBadgeText}>HIPAA Safe Harbor</Text>
              </View>
            </View>
            
            <View style={styles.aiInsightsContainer}>
              <Text style={styles.aiDisclaimer}>
                The following analysis is generated using deidentified patient data in compliance with HIPAA Safe Harbor standards. This summary is intended to assist healthcare providers and should not replace clinical judgment.
              </Text>
              
              {medicalReport.ai_insights.symptom_patterns && (
                <View style={styles.professionalInsightCard}>
                  <View style={styles.insightCardHeader}>
                    <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
                    <Text style={styles.insightCardTitle}>Symptom Pattern Analysis</Text>
                  </View>
                  <View style={styles.insightCardContent}>
                    {typeof medicalReport.ai_insights.symptom_patterns === 'string' ? (
                      <Text style={styles.professionalInsightText}>
                        {medicalReport.ai_insights.symptom_patterns}
                      </Text>
                    ) : (
                      <View style={styles.bulletPointContainer}>
                        {Object.entries(medicalReport.ai_insights.symptom_patterns).map(([key, value], index) => (
                          <View key={index} style={styles.bulletPoint}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>
                              <Text style={styles.bulletLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</Text> {String(value)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              {medicalReport.ai_insights.trigger_correlation && (
                <View style={styles.professionalInsightCard}>
                  <View style={styles.insightCardHeader}>
                    <Ionicons name="link-outline" size={20} color={Colors.warning} />
                    <Text style={styles.insightCardTitle}>Trigger Correlation Analysis</Text>
                  </View>
                  <View style={styles.insightCardContent}>
                    {typeof medicalReport.ai_insights.trigger_correlation === 'string' ? (
                      <Text style={styles.professionalInsightText}>
                        {medicalReport.ai_insights.trigger_correlation}
                      </Text>
                    ) : (
                      <View style={styles.bulletPointContainer}>
                        {Object.entries(medicalReport.ai_insights.trigger_correlation).map(([key, value], index) => (
                          <View key={index} style={styles.bulletPoint}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>
                              <Text style={styles.bulletLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</Text> {String(value)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              {medicalReport.ai_insights.recommendations && (
                <View style={styles.professionalInsightCard}>
                  <View style={styles.insightCardHeader}>
                    <Ionicons name="medical-outline" size={20} color={Colors.success} />
                    <Text style={styles.insightCardTitle}>Clinical Recommendations</Text>
                  </View>
                  <View style={styles.insightCardContent}>
                    {typeof medicalReport.ai_insights.recommendations === 'string' ? (
                      <Text style={styles.professionalInsightText}>
                        {medicalReport.ai_insights.recommendations}
                      </Text>
                    ) : Array.isArray(medicalReport.ai_insights.recommendations) ? (
                      <View style={styles.bulletPointContainer}>
                        {medicalReport.ai_insights.recommendations.map((recommendation: any, index: number) => (
                          <View key={index} style={styles.bulletPoint}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{String(recommendation)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.bulletPointContainer}>
                        {Object.entries(medicalReport.ai_insights.recommendations).map(([key, value], index) => (
                          <View key={index} style={styles.bulletPoint}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>
                              <Text style={styles.bulletLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</Text> {String(value)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.aiFooterNote}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
                <Text style={styles.aiFooterText}>
                  Analysis generated on {new Date().toLocaleDateString()} using advanced medical AI algorithms trained on anonymized clinical data.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Doctor Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor Notes</Text>
          <TextInput
            style={styles.doctorNotesInput}
            multiline
            numberOfLines={6}
            placeholder="Add notes for healthcare provider consultation..."
            value={doctorNotes}
            onChangeText={setDoctorNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export & Share</Text>
          <View style={styles.actionsGrid}>
            <ModernButton
              title="Generate Report"
              variant="primary"
              onPress={generateComprehensiveReport}
              disabled={reportLoading}
              style={styles.actionButton}
            />
            <ModernButton
              title="Save as PDF"
              variant="secondary"
              onPress={handleDownloadReport}
              style={styles.actionButton}
            />
            <ModernButton
              title="Share with Doctor"
              variant="outline"
              onPress={handleShareReport}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Report Footer */}
        <View style={styles.footer}>
          <Ionicons name="medical" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.footerText}>
            Medical Report Generated: {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>
            Symply Allergy - HIPAA Compliant Allergy Management
          </Text>
          <Text style={styles.footerTextSmall}>
            All data deidentified per Safe Harbor standards for AI analysis
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
  // Patient Header Styles
  patientHeader: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeaderContent: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientHeaderDetails: {
    marginLeft: 16,
    flex: 1,
  },
  patientHeaderName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  patientHeaderInfo: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  reportDateContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  reportPeriod: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Date Range Styles
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.surface,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Family History Styles
  familyHistoryContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  familyHistoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  familyHistoryChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyHistoryChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  familyHistoryChipText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  // Allergies Styles
  allergiesContainer: {
    gap: 8,
  },
  igeAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722', // Red for immediate/IgE
  },
  nonIgeAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800', // Orange for delayed/non-IgE
  },
  confirmedAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  suspectedAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  igeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722', // Red for IgE-mediated
    marginRight: 12,
  },
  nonIgeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800', // Orange for non-IgE
    marginRight: 12,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginRight: 12,
  },
  suspectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
    marginRight: 12,
  },
  allergyName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  allergyStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  // Medications Styles
  medicationsContainer: {
    gap: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  medicationName: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  // Incident Log Styles
  incidentLogContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  incidentStats: {
    flexDirection: 'row',
    gap: 12,
  },
  // Photo Evidence Styles
  photoEvidenceContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  photoEvidenceItem: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 8,
  },
  photoEvidenceImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginBottom: 8,
  },
  photoEvidenceDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  photoEvidenceDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  // Symptom Chart Styles
  symptomList: {
    gap: 12,
  },
  symptomChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  symptomIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    width: 100,
  },
  symptomBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  symptomBar: {
    height: '100%',
    borderRadius: 4,
  },
  symptomValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  // AI Insights Styles
  aiSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
    textTransform: 'uppercase',
  },
  aiInsightsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiDisclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: 'italic',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  professionalInsightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    gap: 10,
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  insightCardContent: {
    padding: 16,
  },
  professionalInsightText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bulletPointContainer: {
    gap: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: 1,
  },
  bulletText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  bulletLabel: {
    fontWeight: '600',
    color: Colors.primary,
  },
  aiFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  aiFooterText: {
    fontSize: 12,
    color: Colors.info,
    flex: 1,
    lineHeight: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  privacyNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  insightSection: {
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
  },
  // Doctor Notes Styles
  doctorNotesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.surface,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  // Common Styles
  noDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
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
  footerTextSmall: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Profile selection styles
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  chipContainer: {
    marginBottom: 12,
  },
  chipContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  noChildrenContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noChildrenText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
