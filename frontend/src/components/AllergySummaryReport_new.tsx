// filepath: c:\Users\sam_w\OneDrive\Documents\AllergyApp\frontend\src\components\AllergySummaryReport.tsx
import React, { useRef, useState, useEffect } from "react";
import { Button, View, Text, Image, ScrollView, Alert, Platform } from "react-native";

interface AllergySummaryReportProps {
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
    photos?: string[];
  };
}

const AllergySummaryReport: React.FC<AllergySummaryReportProps> = ({ patient }) => {
  const reportRef = useRef<any>(null);
  const [MobilePDFComponent, setMobilePDFComponent] = useState<React.ComponentType<any> | null>(null);

  // Load mobile PDF component dynamically on mobile platforms only
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      import('./MobilePDFGenerator').then(module => {
        setMobilePDFComponent(() => module.default);
      }).catch(err => {
        console.error('Failed to load mobile PDF component:', err);
      });
    }
  }, []);

  const generatePDF = async () => {
    try {
      if (typeof window !== "undefined") {
        // Only load PDF libraries on web - avoid Firebase entirely for now
        const jsPDF = (await import("jspdf")).default;
        const html2canvas = (await import("html2canvas")).default;
        
        const input = reportRef.current;
        const canvas = await html2canvas(input);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        // For now, just download the PDF directly without Firebase upload
        pdf.save(`${patient.name.replace(" ", "_")}_AllergySummary.pdf`);
        
        Alert.alert("Success", "PDF has been downloaded to your device.");
      } else {
        Alert.alert("PDF generation is only supported on web in this version.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate report.");
    }
  };

  // For mobile platforms, render the mobile-specific PDF UI
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Allergy Summary Report</Text>
        <Text>Patient: {patient.name}</Text>
        <Text>Date of Birth: {patient.dob}</Text>
        <Text>Parent/Guardian: {patient.guardian}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Diagnosed and Suspected Allergies</Text>
        <Text>{patient.allergies}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Allergy Testing</Text>
        <Text>{patient.testing}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Reaction History</Text>
        <Text>{patient.reactions}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Eczema & Related History</Text>
        <Text>{patient.eczema}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Current Management Plan</Text>
        <Text>{patient.management}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Upcoming Plans</Text>
        <Text>{patient.upcoming}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Attachments</Text>
        <Text>{patient.attachments}</Text>
        {patient.photos && patient.photos.map((src, idx) => (
          <Image key={idx} source={{ uri: src }} style={{ width: 120, height: 80, marginVertical: 8, borderRadius: 8 }} />
        ))}
        <View style={{ height: 16 }} />
        {MobilePDFComponent && <MobilePDFComponent patient={patient} />}
      </View>
    );
  }

  // For web platforms, render the web-specific PDF UI
  return (
    <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16 }}>
      <View ref={reportRef} style={{ width: "100%", maxWidth: 600, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginVertical: 16, elevation: 2 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>Allergy Summary Report</Text>
        <Text style={{ fontWeight: "bold" }}>Patient: <Text style={{ fontWeight: "normal" }}>{patient.name}</Text></Text>
        <Text>Date of Birth: {patient.dob}</Text>
        <Text>Parent/Guardian: {patient.guardian}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Diagnosed and Suspected Allergies</Text>
        <Text>{patient.allergies}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Allergy Testing</Text>
        <Text>{patient.testing}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Reaction History</Text>
        <Text>{patient.reactions}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Eczema & Related History</Text>
        <Text>{patient.eczema}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Current Management Plan</Text>
        <Text>{patient.management}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Upcoming Plans</Text>
        <Text>{patient.upcoming}</Text>
        <Text style={{ marginTop: 12, fontWeight: "bold" }}>Attachments</Text>
        <Text>{patient.attachments}</Text>
        {patient.photos && patient.photos.map((src, idx) => (
          <Image key={idx} source={{ uri: src }} style={{ width: 120, height: 80, marginVertical: 8, borderRadius: 8 }} />
        ))}
        <Button title="Generate & Download PDF" onPress={generatePDF} />
      </View>
    </ScrollView>
  );
};

export default AllergySummaryReport;
