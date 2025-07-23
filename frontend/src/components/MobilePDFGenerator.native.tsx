// Use only expo-print and expo-sharing for PDF generation and sharing in Expo Go
import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';

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
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const generatePdf = async () => {
    setLoading(true);
    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
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
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      setPdfUri(uri);
      Alert.alert('PDF Generated', 'PDF file created successfully.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sharePdf = async () => {
    if (!pdfUri) {
      Alert.alert('No PDF', 'Please generate the PDF first.');
      return;
    }
    setLoading(true);
    try {
      const Sharing = await import('expo-sharing');
      await Sharing.shareAsync(pdfUri);
    } catch (err: any) {
      Alert.alert('Share Error', 'Failed to share PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Generate PDF" onPress={generatePdf} disabled={loading} />
      <View style={{ height: 8 }} />
      <Button title="Share PDF" onPress={sharePdf} disabled={loading || !pdfUri} />
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
    </View>
  );
};

export default MobilePDFGenerator;
