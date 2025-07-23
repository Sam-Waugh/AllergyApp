import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, Platform } from 'react-native';
// Remove static Firebase imports - handle dynamically
// import { getDownloadURL, ref } from 'firebase/storage';
// import { storage } from '../firebaseConfig';

interface DoctorReportDownloadProps {
  userId: string;
}

const DoctorReportDownload: React.FC<DoctorReportDownloadProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const handleDownload = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Dynamically import Firebase storage only on web
        const { getDownloadURL, ref } = await import('firebase/storage');
        const { storage } = await import('../firebaseConfig');
        
        if (!storage) {
          throw new Error('Firebase storage not available');
        }
        
        // Assume reports are stored as 'doctorReports/{userId}.pdf'
        const fileRef = ref(storage, `doctorReports/${userId}.pdf`);
        const url = await getDownloadURL(fileRef);
        setDownloadUrl(url);
        Alert.alert('Download Ready', 'Your doctor report is ready to download.');
      } else {
        Alert.alert('Error', 'Download is only supported on web in this version.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ alignItems: 'center', margin: 16 }}>
      <Button title="Prepare & Download Doctor Report" onPress={handleDownload} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}      {downloadUrl && Platform.OS === 'web' && (
        <Text style={{ marginTop: 12, color: 'blue' }} onPress={() => {
          // Open the download URL in a browser
          window.open(downloadUrl, '_blank');
        }}>
          Tap here to download your report
        </Text>
      )}
    </View>
  );
};

export default DoctorReportDownload;
