import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AllergySummaryReport from '../components/AllergySummaryReport';
import { reportService } from '../services/EnvironmentService';

export default function DoctorReportScreen() {
  const [patient, setPatient] = useState({
    name: 'Jane Doe',
    dob: '2010-05-15',
    guardian: 'John Doe',
    allergies: 'Peanuts, Tree nuts',
    testing: 'Skin prick test, IgE blood test',
    reactions: 'Hives, swelling, anaphylaxis',
    eczema: 'Mild, seasonal',
    management: 'EpiPen, antihistamines, avoidance',
    upcoming: 'Oral food challenge in July',
    attachments: 'Lab results, doctor notes',
    photos: [],
  });
  
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to generate AI-powered report
  const generateAIReport = async () => {
    setIsGeneratingAI(true);
    setError(null);
    
    try {
      console.log('🤖 Generating AI-powered allergy report...');
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 months ago
      const endDate = new Date();
      
      const response = await reportService.generateDoctorReport(
        'child_1751823814217_1wjfre4n6', // Use your actual Firestore child ID
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      if (response.success && response.data) {
        console.log('✅ AI report generated successfully');          // Parse the report if it's JSON
          let reportContent = '';
          let reportMetadata = null;
          try {
            const parsedReport = typeof response.data === 'string' ? 
              JSON.parse(response.data) : response.data;
            
            // Check if this is a hybrid report and if it has formatted text
            if (parsedReport.report_text) {
              // Use the formatted text report
              reportContent = parsedReport.report_text;
              console.log('🔄 Using formatted hybrid report text');
            } else if (parsedReport.report_generation && parsedReport.report_generation.method === "Hybrid AI + Local Processing") {
              console.log('🔄 Hybrid AI report detected - formatting JSON structure');
              
              // Extract key sections for better display
              reportMetadata = {
                method: parsedReport.report_generation.method,
                aiComponent: parsedReport.report_generation.ai_component,
                localComponent: parsedReport.report_generation.local_component,
                patientName: parsedReport.patient_information?.patient_name || 'Unknown',
                totalSections: Object.keys(parsedReport).length,
                hasAIInsights: !!parsedReport.ai_medical_insights,
                hasPersonalData: !!parsedReport.patient_information,
                containsPHI: parsedReport.report_generation.contains_phi,
                hipaaCompliant: parsedReport.report_generation.hipaa_compliant
              };
              
              // Format for display - show key sections clearly
              reportContent = `=== HYBRID AI MEDICAL REPORT ===
Patient: ${parsedReport.patient_information?.patient_name || 'Unknown'}
Date of Birth: ${parsedReport.patient_information?.date_of_birth || 'Unknown'}
Age: ${parsedReport.patient_information?.age || 'Unknown'}
Parent/Guardian: ${parsedReport.patient_information?.parent_guardian || 'Unknown'}

=== AI MEDICAL INSIGHTS ===
${parsedReport.ai_medical_insights?.analysis || 'No AI analysis available'}

=== REPORT GENERATION DETAILS ===
Method: ${parsedReport.report_generation?.method || 'Unknown'}
AI Component: ${parsedReport.report_generation?.ai_component || 'Unknown'}
Local Component: ${parsedReport.report_generation?.local_component || 'Unknown'}
Contains PHI: ${parsedReport.report_generation?.contains_phi ? 'YES' : 'NO'}
HIPAA Compliant: ${parsedReport.report_generation?.hipaa_compliant ? 'YES' : 'NO'}
Generated: ${parsedReport.report_generation?.generated_at || 'Unknown'}`;
            } else if (parsedReport.report_text) {
              reportContent = parsedReport.report_text;
            } else {
              reportContent = JSON.stringify(parsedReport, null, 2);
            }
            
            // Check for AI indicators
            const hasAIIndicators = reportContent.includes('🤖') || 
                                    reportContent.includes('AI-GENERATED') ||
                                    reportContent.includes('OpenAI o4-mini') ||
                                    reportContent.includes('Hybrid AI') ||
                                    reportContent.includes('AI MEDICAL ANALYSIS');
            
            if (hasAIIndicators) {
              console.log('🤖 AI generation confirmed in response');
            }
            
          } catch (e) {
            reportContent = typeof response.data === 'string' ? 
              response.data : JSON.stringify(response.data, null, 2);
          }
        
        setAiReport(reportContent);
        
        // Update patient data with hybrid AI-generated content indicators
        setPatient(prev => ({
          ...prev,
          name: 'Hybrid AI Report (Real Patient Data + AI Insights)',
          allergies: 'Real allergy data enhanced with AI analysis (see full report below)',
          management: '🤖 AI-Enhanced Management Plan with Personal Data',
          attachments: 'Hybrid report: AI medical insights + complete personal information'
        }));
        
      } else {
        throw new Error(response.error || 'Failed to generate AI report');
      }
    } catch (err) {
      console.error('❌ AI report generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Auto-generate AI report on component mount
  useEffect(() => {
    generateAIReport();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <div style={{ width: '100vw', height: '100vh', minHeight: '100vh', background: '#f5f5f5', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1976d2', margin: '32px 0 8px 0' }}>
          🤖 Hybrid AI-Powered Doctor Report
        </h1>
        <div style={{ fontSize: 16, color: '#1976d2', marginBottom: 24 }}>
          AI insights + Complete personal data • HIPAA-compliant hybrid approach
        </div>
        
        {/* AI Generation Status */}
        {isGeneratingAI && (
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🤖 Generating Hybrid AI Report...</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              AI analyzes de-identified data • Local system adds personal information
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #dc3545'
          }}>
            <strong>❌ AI Report Error:</strong> {error}
            <br />
            <button 
              onClick={generateAIReport} 
              style={{ 
                marginTop: '10px', 
                padding: '8px 16px', 
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Retry AI Generation
            </button>
          </div>
        )}
        
        {/* AI Report Display */}
        {aiReport && (
          <div style={{ 
            background: '#d4edda', 
            border: '2px solid #28a745', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h3 style={{ color: '#155724', margin: '0 0 15px 0' }}>
              🤖 Hybrid AI Medical Report (AI Insights + Complete Personal Data)
            </h3>
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '8px', 
              fontFamily: 'monospace', 
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #28a745'
            }}>
              {aiReport}
            </div>
          </div>
        )}
        
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#333' }}>
          Traditional Report Format
        </div>
        <AllergySummaryReport patient={patient} />
      </div>
    );
  }

  // Only import and use React Native components for mobile
  const ReactNative = require('react-native');
  const { SafeAreaView, View, Text, ScrollView, StyleSheet } = ReactNative;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      backgroundColor: '#2196F3',
      padding: 20,
      paddingTop: 40,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#E3F2FD',
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: '#fff',
      margin: 10,
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: '#333',
    },
    emptyText: {
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic',
      padding: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doctor Report</Text>
        <Text style={styles.headerSubtitle}>Export health data for medical visits</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate Report</Text>
          <AllergySummaryReport patient={patient} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
