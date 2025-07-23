// Mobile-only PDF generation component - Only loaded on mobile platforms
import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator, Platform } from 'react-native';

interface MobilePDFGeneratorProps {
  patient: {
    name: string;
    dob: string;
    guardian: string;
    allergies: string;
    testing: string;
    reactions: string;
    eczema: string;
    management: string;
    upcoming: string;
    attachments?: string;
  };
}

const MobilePDFGenerator: React.FC<MobilePDFGeneratorProps> = ({ patient }) => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const generatePdf = async () => {
    setLoading(true);
    try {
      // Using eval to make the require call undetectable by Metro bundler
      const RNHTMLtoPDF = eval('require')('react-native-html-to-pdf');
      
      const htmlContent = `
        <h1>Allergy Summary Report</h1>
        <p><b>Patient:</b> ${patient.name}</p>
        <p><b>Date of Birth:</b> ${patient.dob}</p>
        <p><b>Parent/Guardian:</b> ${patient.guardian}</p>
        <p><b>Diagnosed and Suspected Allergies:</b> ${patient.allergies}</p>
        <p><b>Allergy Testing:</b> ${patient.testing}</p>
        <p><b>Reaction History:</b> ${patient.reactions}</p>
        <p><b>Eczema & Related History:</b> ${patient.eczema}</p>
        <p><b>Current Management Plan:</b> ${patient.management}</p>
        <p><b>Upcoming Plans:</b> ${patient.upcoming}</p>
        <p><b>Attachments:</b> ${patient.attachments}</p>
      `;

      const { filePath } = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: `Allergy_Report_${Date.now()}`,
        base64: false,
      });
      
      if (!filePath) throw new Error('PDF generation failed');
      setPdfUrl(filePath);
      Alert.alert('PDF Generated', 'PDF file created successfully.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async () => {
    if (!pdfUrl) {
      Alert.alert('No PDF', 'Please generate the PDF first.');
      return;
    }
    setLoading(true);
    try {
      // Using eval to make the require call undetectable by Metro bundler
      const storage = eval('require')('@react-native-firebase/storage').default;
      
      const fileName = pdfUrl.split('/').pop();
      const ref = storage().ref(`doctor_reports/${fileName}`);
      await ref.putFile(pdfUrl);
      const url = await ref.getDownloadURL();
      setDownloadUrl(url);
      Alert.alert('Upload Success', 'PDF uploaded to cloud.');
    } catch (err: any) {
      Alert.alert('Upload Error', 'Failed to upload PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!downloadUrl) {
      Alert.alert('No Download URL', 'Please upload the PDF first.');
      return;
    }
    setLoading(true);
    try {
      // Using eval to make the require calls undetectable by Metro bundler
      const FileSystem = eval('require')('expo-file-system');
      const Sharing = eval('require')('expo-sharing');
      
      const localUri = FileSystem.documentDirectory + `Allergy_Report_${Date.now()}.pdf`;
      const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri);
      await Sharing.shareAsync(downloadRes.uri);
    } catch (err: any) {
      Alert.alert('Download Error', 'Failed to download or share PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Generate PDF" onPress={generatePdf} disabled={loading} />
      <View style={{ height: 8 }} />
      <Button title="Upload PDF to Cloud" onPress={uploadPdf} disabled={loading || !pdfUrl} />
      <View style={{ height: 8 }} />
      <Button title="Download/Share PDF" onPress={downloadPdf} disabled={loading || !downloadUrl} />
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
    </View>
  );
};

export default MobilePDFGenerator;
