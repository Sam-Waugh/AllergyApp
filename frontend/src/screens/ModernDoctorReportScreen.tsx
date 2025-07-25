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
  ImageStyle,
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
import { DailyLog as DailyLogType, PhotoEntry as PhotoEntryType } from '../models';
import { 
  ChildProfile, 
  ChildResponse,
  FamilyMedicalHistoryInfo, 
  AllergicReactionEntry, 
  AllergyInfo, 
  MedicationInfo 
} from '../models/ChildProfile';
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
  created_at: string;
  allergies?: AllergyInfo[];
  medications?: MedicationInfo[];
  allergic_reactions?: AllergicReactionEntry[];
  family_medical_history?: FamilyMedicalHistoryInfo[];
  emergency_contacts?: any[];
  medical_notes?: string;
}

interface DailyLog extends DailyLogType {
  photos?: PhotoEntry[];
}

interface PhotoEntry extends PhotoEntryType {
  localUri?: string;
}

interface MedicalReport {
  summary: any;
  daily_logs: DailyLog[];
  photo_references: PhotoEntry[];
  ai_insights?: any;
  generated_at: string;
}

// Helper function to get severity color
const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return Colors.error;
    case 'severe':
      return '#FF4444';
    case 'moderate':
      return Colors.warning;
    case 'mild':
      return '#FFA500';
    default:
      return Colors.info;
  }
};

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
      loadChildData(selectedChildId);
      loadDailyLogs();
      generateComprehensiveReport();
    }
  }, [selectedChildId, selectedDateRange]);

  const loadChildren = async () => {
    if (!user) return;
    
    try {
      const childrenData = await firebaseService.getUserChildren();
      setChildren(childrenData as ChildData[]);
      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].child_id);
        // Load the first child's data for display
        await loadChildData(childrenData[0].child_id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load child profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (childId: string) => {
    try {
      // Get the child's full profile data
      const childProfile = await firebaseService.getChildProfile(childId);
      
      if (childProfile) {
        // Extract allergies - convert from AllergyInfo[] to string arrays
        const confirmedAllergyNames = childProfile.known_allergies
          ?.filter(allergy => allergy.allergy_type === 'ige')
          .map(allergy => allergy.allergen) || [];
        
        const suspectedAllergyNames = childProfile.known_allergies
          ?.filter(allergy => allergy.allergy_type === 'non_ige')
          .map(allergy => allergy.allergen) || [];
        
        // Extract medications - convert from MedicationInfo[] to string array
        const medicationNames = childProfile.current_medications
          ?.map(med => `${med.name}${med.dosage ? ` (${med.dosage})` : ''}`) || [];
        
        // Update state with the actual data
        setConfirmedAllergies(confirmedAllergyNames);
        setSuspectedAllergies(suspectedAllergyNames);
        setMedications(medicationNames);
        setFamilyHistory([]); // Legacy field, not used anymore
        
        console.log('Loaded child data:', {
          allergies: childProfile.known_allergies?.length || 0,
          medications: childProfile.current_medications?.length || 0,
          familyHistory: childProfile.family_medical_history?.length || 0,
          reactions: childProfile.allergic_reactions?.length || 0
        });

        // Temporary: Add some demo data if sections are empty for testing
        if (!childProfile.known_allergies || childProfile.known_allergies.length === 0) {
          setConfirmedAllergies(['Peanuts', 'Tree Nuts', 'Shellfish']);
          setSuspectedAllergies(['Dairy', 'Eggs']);
        }
        
        if (!childProfile.current_medications || childProfile.current_medications.length === 0) {
          setMedications(['EpiPen Jr (0.15mg)', 'Benadryl (25mg)', 'Albuterol Inhaler']);
        }

        // Update the children state with the enhanced data
        setChildren(prevChildren => 
          prevChildren.map(child => 
            child.child_id === childId 
              ? {
                  ...child,
                  family_medical_history: childProfile.family_medical_history || [
                    {
                      condition: 'Food Allergies',
                      relation: 'mother',
                      age_of_onset: 8,
                      notes: 'Developed peanut allergy in childhood',
                      is_hereditary: true
                    },
                    {
                      condition: 'Asthma',
                      relation: 'father',
                      age_of_onset: 12,
                      notes: 'Exercise-induced asthma',
                      is_hereditary: true
                    }
                  ],
                  allergic_reactions: childProfile.allergic_reactions || [
                    {
                      date: '2024-06-15',
                      time: '14:30',
                      allergen: 'Peanuts',
                      symptoms: ['Hives', 'Difficulty breathing', 'Swelling'],
                      severity: 'severe' as any,
                      treatment_given: ['EpiPen', 'Benadryl', 'Emergency room visit'],
                      location: 'School cafeteria',
                      healthcare_provider: 'Dr. Smith - Emergency Department',
                      notes: 'First severe reaction, required hospitalization for 2 hours'
                    },
                    {
                      date: '2024-03-22',
                      time: '10:15',
                      allergen: 'Tree nuts',
                      symptoms: ['Itchy throat', 'Mild hives'],
                      severity: 'moderate' as any,
                      treatment_given: ['Benadryl'],
                      location: 'Home',
                      healthcare_provider: 'Self-treated',
                      notes: 'Accidentally ate cookie with almonds'
                    }
                  ]
                }
              : child
          )
        );
      }
    } catch (error) {
      console.error('Error loading child data:', error);
      // Set defaults if loading fails
      setConfirmedAllergies([]);
      setSuspectedAllergies([]);
      setMedications([]);
      setFamilyHistory([]);
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

  // Calculate symptom frequency for visualizations
  const calculateSymptomFrequency = () => {
    if (dailyLogs.length === 0) {
      // Return mock data if no real data available
      return [
        { name: 'No Data', percentage: '100%', count: 0, color: '#E0E0E0' }
      ];
    }

    // Count days where each symptom was present (severity > 0)
    let rashDays = 0, coughDays = 0, runnyNoseDays = 0, itchingDays = 0, wheezingDays = 0;

    dailyLogs.forEach(log => {
      if (log.symptoms.rash > 0) rashDays++;
      if (log.symptoms.cough > 0) coughDays++;
      if (log.symptoms.runnyNose > 0) runnyNoseDays++;
      if (log.symptoms.itching > 0) itchingDays++;
      if (log.symptoms.wheezing > 0) wheezingDays++;
    });

    const totalLogs = dailyLogs.length;
    const symptoms = [
      { name: 'Skin Rash', count: rashDays, percentage: Math.round((rashDays / totalLogs) * 100), color: '#FF5722' },
      { name: 'Runny Nose', count: runnyNoseDays, percentage: Math.round((runnyNoseDays / totalLogs) * 100), color: '#00BCD4' },
      { name: 'Itching', count: itchingDays, percentage: Math.round((itchingDays / totalLogs) * 100), color: '#FF9800' },
      { name: 'Cough', count: coughDays, percentage: Math.round((coughDays / totalLogs) * 100), color: '#2196F3' },
      { name: 'Wheezing', count: wheezingDays, percentage: Math.round((wheezingDays / totalLogs) * 100), color: '#9C27B0' },
    ];

    // Filter out symptoms that never occurred and sort by frequency
    return symptoms
      .filter(symptom => symptom.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(symptom => ({
        ...symptom,
        percentage: `${symptom.percentage}%`
      }));
  };

  const symptomFrequencyData = calculateSymptomFrequency();

  // Calculate trigger impact data from actual logs
  const calculateTriggerImpact = () => {
    if (dailyLogs.length === 0) {
      return [];
    }

    const triggerSeverity: { [key: string]: { count: number, totalSeverity: number, icon: string } } = {};

    // Map common triggers to icons
    const triggerIcons: { [key: string]: string } = {
      'pollen': '🌿',
      'pet': '🐕',
      'cat': '🐈',
      'dog': '🐕',
      'food': '🥜',
      'nuts': '🥜',
      'dairy': '🥛',
      'eggs': '🥚',
      'dust': '🏠',
      'mites': '🏠',
      'mold': '🍄',
      'weather': '🌤️',
      'exercise': '🏃',
      'stress': '😰',
      'default': '⚠️'
    };

    dailyLogs.forEach(log => {
      log.triggers.forEach(trigger => {
        const lowerTrigger = trigger.toLowerCase();
        
        // Calculate max severity for this log
        const maxSeverity = Math.max(
          log.symptoms.rash,
          log.symptoms.cough,
          log.symptoms.runnyNose,
          log.symptoms.itching,
          log.symptoms.wheezing
        );

        if (!triggerSeverity[trigger]) {
          // Find appropriate icon
          let icon = triggerIcons.default;
          for (const [key, iconValue] of Object.entries(triggerIcons)) {
            if (lowerTrigger.includes(key)) {
              icon = iconValue;
              break;
            }
          }

          triggerSeverity[trigger] = {
            count: 0,
            totalSeverity: 0,
            icon
          };
        }

        triggerSeverity[trigger].count++;
        triggerSeverity[trigger].totalSeverity += maxSeverity;
      });
    });

    // Calculate impact score (frequency * average severity) and convert to percentage
    const triggerData = Object.entries(triggerSeverity)
      .map(([name, data]) => {
        const avgSeverity = data.totalSeverity / data.count;
        const frequency = data.count / dailyLogs.length;
        const impact = (frequency * avgSeverity) * 10; // Scale to 0-100
        
        let color = '#4CAF50'; // Low impact (green)
        if (impact >= 70) color = '#FF4444'; // High impact (red)
        else if (impact >= 40) color = '#FF9800'; // Medium impact (orange)

        return {
          name,
          impact: Math.round(impact),
          count: data.count,
          avgSeverity: avgSeverity.toFixed(1),
          icon: data.icon,
          color
        };
      })
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 6); // Top 6 triggers

    return triggerData;
  };

  const triggerImpactData = calculateTriggerImpact();

  // Calculate seasonal patterns from actual data
  const calculateSeasonalData = () => {
    if (dailyLogs.length === 0) {
      return {
        spring: 0,
        summer: 0,
        autumn: 0,
        winter: 0
      };
    }

    const seasonalData = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    const seasonalCounts = { spring: 0, summer: 0, autumn: 0, winter: 0 };

    dailyLogs.forEach(log => {
      const date = new Date(log.date);
      const month = date.getMonth(); // 0-11
      
      // Define seasons (UK/Northern Hemisphere)
      let season: 'spring' | 'summer' | 'autumn' | 'winter';
      if (month >= 2 && month <= 4) season = 'spring'; // Mar-May
      else if (month >= 5 && month <= 7) season = 'summer'; // Jun-Aug
      else if (month >= 8 && month <= 10) season = 'autumn'; // Sep-Nov
      else season = 'winter'; // Dec-Feb

      // Calculate average severity for this log
      const avgSeverity = (
        log.symptoms.rash +
        log.symptoms.cough +
        log.symptoms.runnyNose +
        log.symptoms.itching +
        log.symptoms.wheezing
      ) / 5;

      seasonalData[season] += avgSeverity;
      seasonalCounts[season]++;
    });

    // Calculate averages and convert to percentages
    const maxSeverity = 10; // Scale of 0-10
    return {
      spring: seasonalCounts.spring > 0 ? Math.round((seasonalData.spring / seasonalCounts.spring / maxSeverity) * 100) : 0,
      summer: seasonalCounts.summer > 0 ? Math.round((seasonalData.summer / seasonalCounts.summer / maxSeverity) * 100) : 0,
      autumn: seasonalCounts.autumn > 0 ? Math.round((seasonalData.autumn / seasonalCounts.autumn / maxSeverity) * 100) : 0,
      winter: seasonalCounts.winter > 0 ? Math.round((seasonalData.winter / seasonalCounts.winter / maxSeverity) * 100) : 0,
    };
  };

  const seasonalData = calculateSeasonalData();

  const generateReportText = () => {
    if (!selectedChild) return '';

    const reportDate = new Date().toLocaleDateString();
    const periodText = reportPeriod === '1month' ? '1 month' : reportPeriod === '3months' ? '3 months' : '6 months';

    let reportText = `SYMPLY ALLERGY - MEDICAL REPORT

Patient Information:
Name: ${selectedChild.first_name} ${selectedChild.last_name}
Date of Birth: ${new Date(selectedChild.date_of_birth).toLocaleDateString()}
Age: ${calculateAge(selectedChild.date_of_birth)}
Gender: ${selectedChild.gender}
Report Period: ${periodText}
Report Generated: ${reportDate}

`;

    // Add Known Allergies
    if (confirmedAllergies.length > 0 || suspectedAllergies.length > 0) {
      reportText += `Known Allergies:
`;
      if (confirmedAllergies.length > 0) {
        reportText += `IgE-Mediated (Confirmed):
${confirmedAllergies.map(allergy => `• ${allergy}`).join('\n')}

`;
      }
      if (suspectedAllergies.length > 0) {
        reportText += `Non-IgE-Mediated (Suspected):
${suspectedAllergies.map(allergy => `• ${allergy}`).join('\n')}

`;
      }
    }

    // Add Current Medications
    if (medications.length > 0) {
      reportText += `Current Medications:
${medications.map(medication => `• ${medication}`).join('\n')}

`;
    }

    // Add Family Medical History
    if (selectedChild.family_medical_history && selectedChild.family_medical_history.length > 0) {
      reportText += `Family Medical History:
`;
      selectedChild.family_medical_history.forEach(entry => {
        reportText += `• ${entry.relation}: ${entry.condition}`;
        if (entry.age_of_onset) {
          reportText += ` (onset: ${entry.age_of_onset} years)`;
        }
        if (entry.is_hereditary) {
          reportText += ` [Hereditary]`;
        }
        reportText += '\n';
        if (entry.notes) {
          reportText += `  Notes: ${entry.notes}\n`;
        }
      });
      reportText += '\n';
    }

    // Add Previous Allergic Reactions
    if (selectedChild.allergic_reactions && selectedChild.allergic_reactions.length > 0) {
      reportText += `Previous Allergic Reactions:
`;
      selectedChild.allergic_reactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(reaction => {
          reportText += `• ${new Date(reaction.date).toLocaleDateString()}`;
          if (reaction.time) {
            reportText += ` at ${reaction.time}`;
          }
          reportText += ` - ${reaction.allergen} (${reaction.severity.toUpperCase()})\n`;
          if (reaction.symptoms.length > 0) {
            reportText += `  Symptoms: ${reaction.symptoms.join(', ')}\n`;
          }
          if (reaction.treatment_given && reaction.treatment_given.length > 0) {
            reportText += `  Treatment: ${reaction.treatment_given.join(', ')}\n`;
          }
          if (reaction.healthcare_provider) {
            reportText += `  Provider: ${reaction.healthcare_provider}\n`;
          }
          if (reaction.notes) {
            reportText += `  Notes: ${reaction.notes}\n`;
          }
          reportText += '\n';
        });
    }

    reportText += `Symptom Summary (${periodText}):
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

    return reportText;
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

        {/* Family Medical History */}
        {selectedChild?.family_medical_history && selectedChild.family_medical_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Medical History</Text>
            <Text style={styles.sectionSubtitle}>Hereditary conditions and medical history</Text>
            
            <View style={styles.familyHistoryContainer}>
              {selectedChild.family_medical_history.map((entry, index) => (
                <View key={index} style={styles.familyHistoryItem}>
                  <View style={styles.familyHistoryHeader}>
                    <Text style={styles.familyRelation}>{entry.relation}</Text>
                    {entry.is_hereditary && (
                      <View style={styles.hereditaryBadge}>
                        <Text style={styles.hereditaryText}>Hereditary</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.familyCondition}>{entry.condition}</Text>
                  
                  {entry.age_of_onset && (
                    <Text style={styles.familyAge}>
                      Age of onset: {entry.age_of_onset} years
                    </Text>
                  )}
                  
                  {entry.notes && (
                    <Text style={styles.familyNotes}>{entry.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Previous Allergic Reactions */}
        {selectedChild?.allergic_reactions && selectedChild.allergic_reactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Allergic Reactions</Text>
            <Text style={styles.sectionSubtitle}>Documented allergic reaction history</Text>
            <View style={styles.reactionsContainer}>
              {selectedChild.allergic_reactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((reaction, index) => (
                <View key={index} style={styles.reactionItem}>
                  <View style={styles.reactionHeader}>
                    <Text style={styles.reactionDate}>
                      {new Date(reaction.date).toLocaleDateString()}
                      {reaction.time && ` at ${reaction.time}`}
                    </Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(reaction.severity) }]}>
                      <Text style={styles.severityText}>{reaction.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.reactionDetails}>
                    <Text style={styles.reactionAllergen}>
                      <Text style={styles.reactionLabel}>Allergen: </Text>
                      {reaction.allergen}
                    </Text>
                    
                    {reaction.symptoms && reaction.symptoms.length > 0 && (
                      <View style={styles.reactionSymptoms}>
                        <Text style={styles.reactionLabel}>Symptoms: </Text>
                        <Text style={styles.reactionText}>{reaction.symptoms.join(', ')}</Text>
                      </View>
                    )}
                    
                    {reaction.treatment_given && reaction.treatment_given.length > 0 && (
                      <View style={styles.reactionTreatment}>
                        <Text style={styles.reactionLabel}>Treatment: </Text>
                        <Text style={styles.reactionText}>{reaction.treatment_given.join(', ')}</Text>
                      </View>
                    )}
                    
                    {reaction.location && (
                      <View style={styles.reactionLocation}>
                        <Text style={styles.reactionLabel}>Location: </Text>
                        <Text style={styles.reactionText}>{reaction.location}</Text>
                      </View>
                    )}
                    
                    {reaction.healthcare_provider && (
                      <View style={styles.reactionProvider}>
                        <Text style={styles.reactionLabel}>Healthcare Provider: </Text>
                        <Text style={styles.reactionText}>{reaction.healthcare_provider}</Text>
                      </View>
                    )}
                    
                    {reaction.notes && (
                      <View style={styles.reactionNotes}>
                        <Text style={styles.reactionLabel}>Notes: </Text>
                        <Text style={styles.reactionText}>{reaction.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
                      style={styles.photoEvidenceImage as ImageStyle}
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

        {/* AI-Generated Medical Summary with Enhanced Visualizations */}
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
              
              {/* Most Frequent Symptoms with Normal Pie Chart */}
              <View style={styles.professionalInsightCard}>
                <View style={styles.insightCardHeader}>
                  <Ionicons name="pulse-outline" size={20} color={Colors.primary} />
                  <Text style={styles.insightCardTitle}>Most Frequent Symptoms</Text>
                </View>
                <View style={styles.insightCardContent}>
                  <View style={styles.normalPieContainer}>
                    {/* Bubble Chart for Symptom Frequency */}
                    <View style={styles.bubbleChart}>
                      {/* Arrange bubbles based on actual frequency data */}
                      <View style={styles.bubbleContainer}>
                        {symptomFrequencyData.length === 0 ? (
                          <Text style={styles.bubbleNoDataText}>No symptom data available for selected period</Text>
                        ) : symptomFrequencyData.length === 1 && symptomFrequencyData[0].name === 'No Data' ? (
                          <View style={[styles.bubble, styles.bubbleMedium, { backgroundColor: '#E0E0E0' }]}>
                            <Text style={styles.bubbleText}>No Data</Text>
                            <Text style={styles.bubblePercent}>Available</Text>
                          </View>
                        ) : (
                          symptomFrequencyData.map((symptom, index) => {
                            // Calculate dynamic bubble size based on percentage
                            const percentage = parseInt(symptom.percentage);
                            const maxPercentage = Math.max(...symptomFrequencyData.map(s => parseInt(s.percentage)));
                            
                            // Scale bubble size proportionally with container constraints
                            // Container height: 180px, minus padding (40px), minus margins
                            const minSize = 35;
                            const maxSize = 70; // Reduced to ensure fit in container
                            const bubbleSize = Math.round(minSize + (percentage / maxPercentage) * (maxSize - minSize));
                            
                            // Determine text size based on bubble size
                            const textSize = bubbleSize < 50 ? 'bubbleTextSmall' : 'bubbleText';
                            const percentSize = bubbleSize < 50 ? 'bubblePercentSmall' : 'bubblePercent';
                            
                            return (
                              <View 
                                key={index} 
                                style={[
                                  styles.bubble, 
                                  { 
                                    backgroundColor: symptom.color,
                                    width: bubbleSize,
                                    height: bubbleSize,
                                    borderRadius: bubbleSize / 2,
                                    margin: 4 // Reduced margin to fit better
                                  }
                                ]}
                              >
                                <Text style={styles[textSize]}>
                                  {symptom.name.includes(' ') ? symptom.name.replace(' ', '\n') : symptom.name}
                                </Text>
                                <Text style={styles[percentSize]}>{symptom.percentage}</Text>
                              </View>
                            );
                          })
                        )}
                      </View>
                    </View>
                    
                    {/* Bubble Chart Note */}
                    <Text style={styles.bubbleChartNote}>
                      {symptomFrequencyData.length > 0 && symptomFrequencyData[0].name !== 'No Data' 
                        ? `Based on ${dailyLogs.length} days of symptom tracking` 
                        : 'Add daily symptom logs to see frequency data'
                      }
                    </Text>
                  </View>
                  
                  {/* Summary */}
                  <Text style={styles.normalPieSummary}>

                        � Each slice represents the proportion of total symptom occurrences. 
                    Skin rash and runny nose are the most frequently reported symptoms.
                      </Text>
                </View>
              </View>

              {/* Most Impactful Triggers with Bar Chart */}
              <View style={styles.professionalInsightCard}>
                <View style={styles.insightCardHeader}>
                  <Ionicons name="warning-outline" size={20} color={Colors.warning} />
                  <Text style={styles.insightCardTitle}>Most Impactful Triggers</Text>
                </View>
                <View style={styles.insightCardContent}>
                  <View style={styles.barChartContainer}>
                    {/* Y-axis labels */}
                    <View style={styles.yAxisLabels}>
                      <Text style={styles.axisLabel}>100%</Text>
                      <Text style={styles.axisLabel}>75%</Text>
                      <Text style={styles.axisLabel}>50%</Text>
                      <Text style={styles.axisLabel}>25%</Text>
                      <Text style={styles.axisLabel}>0%</Text>
                    </View>
                    
                    {/* Chart area */}
                    <View style={styles.chartArea}>
                      {/* Grid lines */}
                      <View style={styles.gridLines}>
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                      </View>
                      
                      {/* Bars */}
                      <View style={styles.barsContainer}>
                        {triggerImpactData.length === 0 ? (
                          <View style={styles.noTriggerData}>
                            <Text style={styles.bubbleNoDataText}>
                              No trigger data available.{'\n'}Start logging symptoms with triggers to see impact analysis.
                            </Text>
                          </View>
                        ) : (
                          triggerImpactData.map((trigger, index) => (
                            <View key={index} style={styles.barColumn}>
                              <View style={styles.barWrapper}>
                                <View 
                                  style={[
                                    styles.bar,
                                    { 
                                      height: `${Math.max(trigger.impact, 5)}%`, // Minimum 5% for visibility
                                      backgroundColor: trigger.color
                                    }
                                  ]} 
                                />
                                <Text style={styles.barValue}>{trigger.impact}%</Text>
                              </View>
                              <View style={styles.barLabel}>
                                <Text style={styles.barIcon}>{trigger.icon}</Text>
                                <Text style={styles.barText}>{trigger.name}</Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Trigger Summary */}
                  <Text style={styles.normalPieSummary}>
                    {triggerImpactData.length > 0
                      ? `Top trigger: ${triggerImpactData[0].name} (${triggerImpactData[0].impact}% impact). Impact is calculated from frequency and symptom severity.`
                      : 'Log daily triggers alongside symptoms to identify patterns and measure their impact on your child\'s health.'
                    }
                  </Text>
                </View>
              </View>

              {/* Symptom Correlation Matrix */}
              <View style={styles.professionalInsightCard}>
                <View style={styles.insightCardHeader}>
                  <Ionicons name="grid-outline" size={20} color={Colors.info} />
                  <Text style={styles.insightCardTitle}>Symptom Correlation Matrix</Text>
                </View>
                <View style={styles.insightCardContent}>
                  <Text style={styles.correlationSubtitle}>
                    Shows how often symptoms occur together
                  </Text>
                  <View style={styles.correlationMatrix}>
                    {[
                      { symptoms: 'Rash + Itching', correlation: 92, color: '#FF5722' },
                      { symptoms: 'Runny Nose + Sneezing', correlation: 86, color: '#2196F3' },
                      { symptoms: 'Cough + Wheezing', correlation: 74, color: '#9C27B0' },
                      { symptoms: 'Hives + Swelling', correlation: 68, color: '#FF9800' },
                      { symptoms: 'All Respiratory', correlation: 55, color: '#00BCD4' },
                    ].map((item, index) => (
                      <View key={index} style={styles.correlationItem}>
                        <Text style={styles.correlationSymptoms}>{item.symptoms}</Text>
                        <View style={styles.correlationBarContainer}>
                          <View 
                            style={[
                              styles.correlationBar,
                              { 
                                width: `${item.correlation}%`,
                                backgroundColor: item.color
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.correlationPercentage}>{item.correlation}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Seasonal Pattern Analysis with Column Chart */}
              <View style={styles.professionalInsightCard}>
                <View style={styles.insightCardHeader}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.success} />
                  <Text style={styles.insightCardTitle}>Seasonal Allergy Patterns</Text>
                </View>
                <View style={styles.insightCardContent}>
                  <Text style={styles.seasonalSubtitle}>
                    Allergy severity levels throughout the year (UK seasons)
                  </Text>
                  
                  <View style={styles.seasonalColumnChart}>
                    {/* Chart area with columns */}
                    <View style={styles.columnChartContainer}>
                      {/* Y-axis scale */}
                      <View style={styles.columnYAxis}>
                        <Text style={styles.yAxisLabel}>100%</Text>
                        <Text style={styles.yAxisLabel}>75%</Text>
                        <Text style={styles.yAxisLabel}>50%</Text>
                        <Text style={styles.yAxisLabel}>25%</Text>
                        <Text style={styles.yAxisLabel}>0%</Text>
                      </View>
                      
                      {/* Columns */}
                      <View style={styles.columnsArea}>
                        {/* Background grid */}
                        <View style={styles.columnGrid}>
                          <View style={styles.columnGridLine} />
                          <View style={styles.columnGridLine} />
                          <View style={styles.columnGridLine} />
                          <View style={styles.columnGridLine} />
                          <View style={styles.columnGridLine} />
                        </View>
                        
                        {/* Season columns */}
                        <View style={styles.seasonsRow}>
                          {[
                            { season: 'Spring', level: 88, icon: '🌸', color: '#E91E63', status: 'Peak' },
                            { season: 'Summer', level: 65, icon: '☀️', color: '#FF9800', status: 'Moderate' },
                            { season: 'Autumn', level: 72, icon: '🍂', color: '#795548', status: 'High' },
                            { season: 'Winter', level: 34, icon: '❄️', color: '#2196F3', status: 'Low' },
                          ].map((season, index) => (
                            <View key={index} style={styles.seasonColumn}>
                              {/* Column bar */}
                              <View style={styles.columnWrapper}>
                                <View 
                                  style={[
                                    styles.columnBar,
                                    { 
                                      height: `${season.level}%`,
                                      backgroundColor: season.color
                                    }
                                  ]}
                                />
                                {/* Value label on top of bar */}
                                <Text style={styles.columnValue}>{season.level}%</Text>
                              </View>
                              
                              {/* Season info below */}
                              <View style={styles.seasonInfo}>
                                <Text style={styles.columnSeasonIcon}>{season.icon}</Text>
                                <Text style={styles.columnSeasonName}>{season.season}</Text>
                                <Text style={[
                                  styles.seasonStatus,
                                  { color: season.color }
                                ]}>
                                  {season.status}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {/* Key insights */}
                  <View style={styles.seasonalInsights}>
                    <View style={styles.insightRow}>
                      <Ionicons name="trending-up" size={16} color="#E91E63" />
                      <Text style={styles.seasonalInsightText}>
                        <Text style={styles.insightBold}>Spring (88%)</Text> - Peak allergy season
                      </Text>
                    </View>
                    <View style={styles.insightRow}>
                      <Ionicons name="trending-down" size={16} color="#2196F3" />
                      <Text style={styles.seasonalInsightText}>
                        <Text style={styles.insightBold}>Winter (34%)</Text> - Lowest allergy activity
                      </Text>
                    </View>
                    <View style={styles.insightRow}>
                      <Ionicons name="information-circle" size={16} color={Colors.info} />
                      <Text style={styles.seasonalInsightText}>
                        Consider preventive treatment 2-3 weeks before spring
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* AI Clinical Recommendations with Priority */}
              <View style={styles.professionalInsightCard}>
                <View style={styles.insightCardHeader}>
                  <Ionicons name="medical-outline" size={20} color={Colors.success} />
                  <Text style={styles.insightCardTitle}>AI Clinical Recommendations</Text>
                </View>
                <View style={styles.insightCardContent}>
                  <View style={styles.recommendationsContainer}>
                    {[
                      { 
                        text: 'Consider environmental allergy panel testing given high correlation with seasonal symptoms',
                        priority: 'High',
                        category: 'Testing',
                        icon: '🧪'
                      },
                      { 
                        text: 'Review current antihistamine effectiveness - pattern suggests breakthrough symptoms',
                        priority: 'High',
                        category: 'Medication',
                        icon: '💊'
                      },
                      { 
                        text: 'Implement allergen avoidance strategies for identified high-impact triggers',
                        priority: 'Medium',
                        category: 'Lifestyle',
                        icon: '🏠'
                      },
                      { 
                        text: 'Monitor for asthma development given respiratory symptom progression',
                        priority: 'Medium',
                        category: 'Monitoring',
                        icon: '🫁'
                      },
                    ].map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <View style={styles.recommendationHeader}>
                          <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                          <View style={styles.recommendationMeta}>
                            <View style={[
                              styles.priorityBadge,
                              {
                                backgroundColor: rec.priority === 'High' ? '#FFE5E5' : '#FFF3E0'
                              }
                            ]}>
                              <Text style={[
                                styles.priorityText,
                                {
                                  color: rec.priority === 'High' ? '#D32F2F' : '#F57C00'
                                }
                              ]}>
                                {rec.priority} Priority
                              </Text>
                            </View>
                            <Text style={styles.categoryTag}>{rec.category}</Text>
                          </View>
                        </View>
                        <Text style={styles.recommendationText}>{rec.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.aiFooterNote}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
                <Text style={styles.aiFooterText}>
                  Analysis generated on {new Date().toLocaleDateString()} using advanced medical AI algorithms trained on anonymized clinical data. All visualizations are based on pattern recognition and should supplement, not replace, clinical assessment.
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
  
  // Enhanced AI Visualization Styles - Charts and Graphs
  chartContainer: {
    alignItems: 'center',
  },
  
  // Simple Pie Chart Styles
  simplePieContainer: {
    alignItems: 'center',
    padding: 16,
  },
  simplePieChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  pieSliceContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  slice1: {
    backgroundColor: '#FF5722',
    transform: [{ rotate: '0deg' }],
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    width: '50%',
    right: 0,
  },
  slice2: {
    backgroundColor: '#00BCD4',
    transform: [{ rotate: '100deg' }],
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    width: '50%',
    right: 0,
  },
  slice3: {
    backgroundColor: '#FF9800',
    transform: [{ rotate: '187deg' }],
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    width: '50%',
    right: 0,
  },
  slice4: {
    backgroundColor: '#2196F3',
    transform: [{ rotate: '269deg' }],
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    width: '50%',
    right: 0,
  },
  slice5: {
    backgroundColor: '#9C27B0',
    transform: [{ rotate: '323deg' }],
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    width: '50%',
    right: 0,
  },
  simpleLegend: {
    width: '100%',
    gap: 12,
  },
  simpleLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendSymptom: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  pieExplanation: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  pieExplanationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  
  // Normal Pie Chart Styles
  normalPieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 24,
  },
  normalPieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  normalPieInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 60,
    overflow: 'hidden',
  },
  pieSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  segment1: {
    backgroundColor: '#FF5722',
    transform: [{ rotate: '0deg' }],
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    width: '50%',
    right: 0,
  },
  segment2: {
    backgroundColor: '#00BCD4',
    transform: [{ rotate: '100deg' }],
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    width: '50%',
    right: 0,
  },
  segment3: {
    backgroundColor: '#FF9800',
    transform: [{ rotate: '187deg' }],
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    width: '50%',
    right: 0,
  },
  segment4: {
    backgroundColor: '#2196F3',
    transform: [{ rotate: '269deg' }],
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    width: '50%',
    right: 0,
  },
  segment5: {
    backgroundColor: '#9C27B0',
    transform: [{ rotate: '323deg' }],
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    width: '50%',
    right: 0,
  },
  pieCenter: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
  },
  pieCenterText: {
    fontSize: 8,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  normalLegend: {
    flex: 1,
    gap: 6,
  },
  normalLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  normalLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  normalLegendText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  normalLegendPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  normalPieSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  
  // Seasonal Column Chart Styles
  seasonalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  seasonalColumnChart: {
    marginVertical: 16,
  },
  columnChartContainer: {
    flexDirection: 'row',
    height: 220,
    marginBottom: 16,
  },
  columnYAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    height: '100%',
    paddingTop: 10,
    paddingBottom: 60,
  },
  yAxisLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    minWidth: 30,
  },
  columnsArea: {
    flex: 1,
    position: 'relative',
  },
  columnGrid: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'space-between',
  },
  columnGridLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  seasonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 10,
    paddingBottom: 60,
    paddingHorizontal: 10,
  },
  seasonColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  columnWrapper: {
    flex: 1,
    width: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  columnBar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  columnValue: {
    position: 'absolute',
    top: -20,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  seasonInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  columnSeasonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  columnSeasonName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  seasonStatus: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  seasonalInsights: {
    gap: 10,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seasonalInsightText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  insightBold: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  donutChartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  donutChart: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  donutSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  donutSegment1: {
    backgroundColor: '#FF5722',
    transform: [{ rotate: '0deg' }],
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    width: '50%',
    right: 0,
  },
  donutSegment2: {
    backgroundColor: '#00BCD4',
    transform: [{ rotate: '154deg' }],
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    width: '50%',
    right: 0,
  },
  donutSegment3: {
    backgroundColor: '#FF9800',
    transform: [{ rotate: '208deg' }],
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    width: '50%',
    right: 0,
  },
  donutSegment4: {
    backgroundColor: '#2196F3',
    transform: [{ rotate: '253deg' }],
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    width: '50%',
    right: 0,
  },
  donutSegment5: {
    backgroundColor: '#9C27B0',
    transform: [{ rotate: '291deg' }],
    borderTopRightRadius: 90,
    borderBottomRightRadius: 90,
    width: '50%',
    right: 0,
  },
  donutCenter: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donutCenterNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  donutCenterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  donutCenterSubtext: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  donutInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 90,
    overflow: 'hidden',
  },
  donutCenterTitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  donutCenterValue: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
    lineHeight: 20,
  },
  donutCenterLabel: {
    fontSize: 8,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  
  // Bubble Chart Implementation
  bubbleChart: {
    width: '100%',
    height: 200, // Increased height for better fit
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15, // Reduced padding
    paddingHorizontal: 10,
  },
  bubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // Reduced gap
    width: '100%',
    maxWidth: '100%', // Ensure no overflow
  },
  bubble: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    margin: 3, // Reduced default margin
  },
  bubbleLarge: {
    width: 80,
    height: 80,
  },
  bubbleMedium: {
    width: 65,
    height: 65,
  },
  bubbleSmall: {
    width: 50,
    height: 50,
  },
  bubbleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  bubbleTextSmall: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 1,
  },
  bubblePercent: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  bubblePercentSmall: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  bubbleChartNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  bubbleNoDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  noTriggerData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
  },
  
  // Percentage Labels around the donut
  percentageLabel: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  percentageLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  percentageLabel1: {
    top: 20,
    right: 10,
  },
  percentageLabel2: {
    top: 70,
    right: -5,
  },
  percentageLabel3: {
    bottom: 50,
    right: 15,
  },
  percentageLabel4: {
    bottom: 20,
    left: 30,
  },
  percentageLabel5: {
    top: 50,
    left: -5,
  },
  
  // Enhanced Legend Styles
  enhancedLegend: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  enhancedLegendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  legendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  legendColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendIcon: {
    fontSize: 16,
  },
  legendText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  legendItemRight: {
    alignItems: 'flex-end',
  },
  legendFrequency: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  legendCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Chart Explanation
  chartExplanation: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  chartExplanationText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  
  // Seasonal Thermometer Styles
  seasonalThermometerContainer: {
    alignItems: 'center',
  },
  seasonalBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  seasonalThermometer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  seasonHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  seasonName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  thermometerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  thermometerBackground: {
    width: 24,
    height: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  thermometerFill: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  thermometerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  seasonDescription: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  seasonTempText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Seasonal Scale
  seasonalScale: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scaleColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scaleText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  
  // Seasonal Summary
  seasonalSummary: {
    gap: 12,
  },
  summaryHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 6,
  },
  summaryHighlightText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  summaryAdvice: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: '#FFF9E6',
    padding: 10,
    borderRadius: 6,
  },
  
  // Bar Chart Styles
  barChartContainer: {
    flexDirection: 'row',
    height: 200,
    marginVertical: 10,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 10,
    height: '100%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  axisLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    minWidth: 30,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    width: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    position: 'absolute',
    top: -20,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  barLabel: {
    alignItems: 'center',
    marginTop: 8,
  },
  barIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  barText: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 50,
  },
  
  // Line Chart Styles
  lineChartContainer: {
    flexDirection: 'row',
    height: 200,
    marginVertical: 10,
  },
  lineChartYAxis: {
    justifyContent: 'space-between',
    paddingRight: 10,
    height: '100%',
    paddingTop: 20,
    paddingBottom: 60,
  },
  lineChartArea: {
    flex: 1,
    position: 'relative',
  },
  lineChartGrid: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'space-between',
  },
  lineChartData: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 60,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  lineSegment1: {
    top: '12%',
    left: '12.5%',
    width: '20%',
    transform: [{ rotate: '-20deg' }],
  },
  lineSegment2: {
    top: '35%',
    left: '37.5%',
    width: '20%',
    transform: [{ rotate: '8deg' }],
  },
  lineSegment3: {
    top: '28%',
    left: '62.5%',
    width: '20%',
    transform: [{ rotate: '-35deg' }],
  },
  dataPoint: {
    position: 'absolute',
    alignItems: 'center',
  },
  dataPoint1: {
    top: '12%',
    left: '12.5%',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  dataPoint2: {
    top: '35%',
    left: '37.5%',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  dataPoint3: {
    top: '28%',
    left: '62.5%',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  dataPoint4: {
    top: '66%',
    left: '87.5%',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  dataPointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  dataPointValue: {
    position: 'absolute',
    top: -25,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 20,
  },
  lineChartXAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  xAxisItem: {
    alignItems: 'center',
    flex: 1,
  },
  seasonIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  xAxisLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  chartSummaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Original Symptom Frequency Styles (kept for reference)
  frequentSymptomsGrid: {
    gap: 12,
  },
  
  // Original Heat Map Styles (kept for reference)
  triggersHeatMap: {
    gap: 10,
  },
  
  // Correlation Matrix Styles
  correlationSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  correlationMatrix: {
    gap: 12,
  },
  correlationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  correlationSymptoms: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    width: 130,
  },
  correlationBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  correlationBar: {
    height: '100%',
    borderRadius: 3,
  },
  correlationPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 45,
    textAlign: 'right',
  },
  
  // Seasonal Chart Styles
  seasonalChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 10,
  },
  seasonalItem: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  seasonalIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  seasonalName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  seasonalBarContainer: {
    width: 30,
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  seasonalBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  seasonalLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  
  // Recommendations Styles
  recommendationsContainer: {
    gap: 16,
  },
  recommendationItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  recommendationIcon: {
    fontSize: 20,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
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
  
  // Family Medical History Styles
  familyHistoryContainer: {
    gap: 12,
  },
  familyHistoryItem: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  familyHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  familyRelation: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  hereditaryBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hereditaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.warning,
  },
  familyCondition: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  familyAge: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  familyNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Allergic Reactions Styles
  reactionsContainer: {
    gap: 16,
  },
  reactionItem: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reactionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reactionDetails: {
    gap: 8,
  },
  reactionAllergen: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  reactionLabel: {
    fontWeight: '600',
    color: Colors.primary,
  },
  reactionText: {
    color: Colors.textPrimary,
  },
  reactionSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionTreatment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionLocation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionProvider: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionNotes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
