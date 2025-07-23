// import React, { useRef, useState, useEffect } from "react";
// import { Button, View, Text, Image, ScrollView, Alert, Platform } from "react-native";

// interface AllergySummaryReportProps {
//   patient: {
//     name: string;
//     dob: string;
//     guardian: string;
//     allergies: string;
//     testing: string;
//     reactions: string;
//     eczema: string;
//     management: string;
//     upcoming: string;
//     attachments?: string;
//     photos?: string[];
//   };
// }

// const AllergySummaryReport: React.FC<AllergySummaryReportProps> = ({ patient }) => {
//   const reportRef = useRef<any>(null);
//   const [MobilePDFComponent, setMobilePDFComponent] = useState<React.ComponentType<any> | null>(null);  // Load mobile PDF component dynamically on mobile platforms only
//   useEffect(() => {
//     if (Platform.OS === 'ios' || Platform.OS === 'android') {
//       import('./MobilePDFGenerator').then(module => {
//         setMobilePDFComponent(() => module.default);
//       }).catch(err => {
//         console.error('Failed to load mobile PDF component:', err);
//       });
//     }
//   }, []);

//   const generatePDF = async () => {
//     try {
//       if (typeof window !== "undefined") {
//         // Only load PDF libraries on web - avoid Firebase entirely for now
//         const jsPDF = (await import("jspdf")).default;
//         const html2canvas = (await import("html2canvas")).default;
        
//         const input = reportRef.current;
//         const canvas = await html2canvas(input);
//         const imgData = canvas.toDataURL("image/png");
//         const pdf = new jsPDF("p", "mm", "a4");
//         const imgProps = pdf.getImageProperties(imgData);
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
//         pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

//         // For now, just download the PDF directly without Firebase upload
//         pdf.save(`${patient.name.replace(" ", "_")}_AllergySummary.pdf`);
        
//         Alert.alert("Success", "PDF has been downloaded to your device.");
//       } else {
//         Alert.alert("PDF generation is only supported on web in this version.");
//       }
//     } catch (err: any) {
//       Alert.alert("Error", err.message || "Failed to generate report.");
//     }
//   };

//   // --- MOBILE PDF GENERATION & UPLOAD ---  const generateMobilePdf = async () => {
//     setMobileLoading(true);
//     try {
//       // Only run on mobile platforms
//       if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
//         Alert.alert('Error', 'Mobile PDF generation is only supported on iOS and Android.');
//         return;
//       }

//       // Prepare HTML content for PDF
//       const htmlContent = `
//         <h1>Allergy Summary Report</h1>
//         <p><b>Patient:</b> ${patient.name}</p>
//         <p><b>Date of Birth:</b> ${patient.dob}</p>
//         <p><b>Parent/Guardian:</b> ${patient.guardian}</p>
//         <p><b>Diagnosed and Suspected Allergies:</b> ${patient.allergies}</p>
//         <p><b>Allergy Testing:</b> ${patient.testing}</p>
//         <p><b>Reaction History:</b> ${patient.reactions}</p>
//         <p><b>Eczema & Related History:</b> ${patient.eczema}</p>
//         <p><b>Current Management Plan:</b> ${patient.management}</p>
//         <p><b>Upcoming Plans:</b> ${patient.upcoming}</p>
//         <p><b>Attachments:</b> ${patient.attachments}</p>
//       `;

//       // Use dynamic require with better isolation
//       const RNHTMLtoPDF = eval('require')('react-native-html-to-pdf');
      
//       // Generate PDF
//       const { filePath } = await RNHTMLtoPDF.convert({
//         html: htmlContent,
//         fileName: `Allergy_Report_${Date.now()}`,
//         base64: false,
//       });
      
//       if (!filePath) throw new Error('PDF generation failed');
//       setMobilePdfUrl(filePath);
//       Alert.alert('PDF Generated', 'PDF file created successfully.');
//     } catch (err) {
//       Alert.alert('Error', 'Failed to generate PDF: ' + err.message);
//     } finally {
//       setMobileLoading(false);
//     }
//   };

//   const uploadMobilePdf = async () => {
//     if (!mobilePdfUrl) {
//       Alert.alert('No PDF', 'Please generate the PDF first.');
//       return;
//     }
//     setMobileLoading(true);
//     try {
//       let storageFirebase;
//       if (Platform.OS === 'ios' || Platform.OS === 'android') {
//         storageFirebase = require('@react-native-firebase/storage').default;
//         const fileName = mobilePdfUrl.split('/').pop();
//         const ref = storageFirebase().ref(`doctor_reports/${fileName}`);
//         await ref.putFile(mobilePdfUrl);
//         const downloadUrl = await ref.getDownloadURL();
//         setMobileDownloadUrl(downloadUrl);
//         Alert.alert('Upload Success', 'PDF uploaded to cloud.');
//       }
//     } catch (err) {
//       Alert.alert('Upload Error', 'Failed to upload PDF: ' + err.message);
//     } finally {
//       setMobileLoading(false);
//     }
//   };

//   const downloadMobilePdf = async () => {
//     if (!mobileDownloadUrl) {
//       Alert.alert('No Download URL', 'Please upload the PDF first.');
//       return;
//     }
//     setMobileLoading(true);
//     try {
//       const localUri = FileSystem.documentDirectory + `Allergy_Report_${Date.now()}.pdf`;
//       const downloadRes = await FileSystem.downloadAsync(mobileDownloadUrl, localUri);
//       let Sharing;
//       if (Platform.OS === 'ios' || Platform.OS === 'android') {
//         Sharing = require('expo-sharing');
//         await Sharing.shareAsync(downloadRes.uri);
//       }
//     } catch (err) {
//       Alert.alert('Download Error', 'Failed to download or share PDF: ' + err.message);
//     } finally {
//       setMobileLoading(false);
//     }
//   };

//   // For web, use a div ref; for mobile, just render the content
//   if (Platform.OS === 'ios' || Platform.OS === 'android') {
//     return (
//       <View style={{ padding: 16 }}>
//         <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Allergy Summary Report</Text>
//         <Text>Patient: {patient.name}</Text>
//         <Text>Date of Birth: {patient.dob}</Text>
//         <Text>Parent/Guardian: {patient.guardian}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Diagnosed and Suspected Allergies</Text>
//         <Text>{patient.allergies}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Allergy Testing</Text>
//         <Text>{patient.testing}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Reaction History</Text>
//         <Text>{patient.reactions}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Eczema & Related History</Text>
//         <Text>{patient.eczema}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Current Management Plan</Text>
//         <Text>{patient.management}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Upcoming Plans</Text>
//         <Text>{patient.upcoming}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Attachments</Text>
//         <Text>{patient.attachments}</Text>
//         {patient.photos && patient.photos.map((src, idx) => (
//           <Image key={idx} source={{ uri: src }} style={{ width: 120, height: 80, marginVertical: 8, borderRadius: 8 }} />
//         ))}
//         <View style={{ height: 16 }} />
//         <Button title="Generate PDF" onPress={generateMobilePdf} disabled={mobileLoading} />
//         <View style={{ height: 8 }} />
//         <Button title="Upload PDF to Cloud" onPress={uploadMobilePdf} disabled={mobileLoading || !mobilePdfUrl} />
//         <View style={{ height: 8 }} />
//         <Button title="Download/Share PDF" onPress={downloadMobilePdf} disabled={mobileLoading || !mobileDownloadUrl} />
//         {mobileLoading && <ActivityIndicator style={{ marginTop: 12 }} />}
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16 }}>
//       <View ref={reportRef} style={{ width: "100%", maxWidth: 600, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginVertical: 16, elevation: 2 }}>
//         <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>Allergy Summary Report</Text>
//         <Text style={{ fontWeight: "bold" }}>Patient: <Text style={{ fontWeight: "normal" }}>{patient.name}</Text></Text>
//         <Text>Date of Birth: {patient.dob}</Text>
//         <Text>Parent/Guardian: {patient.guardian}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Diagnosed and Suspected Allergies</Text>
//         <Text>{patient.allergies}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Allergy Testing</Text>
//         <Text>{patient.testing}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Reaction History</Text>
//         <Text>{patient.reactions}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Eczema & Related History</Text>
//         <Text>{patient.eczema}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Current Management Plan</Text>
//         <Text>{patient.management}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Upcoming Plans</Text>
//         <Text>{patient.upcoming}</Text>
//         <Text style={{ marginTop: 12, fontWeight: "bold" }}>Attachments</Text>
//         <Text>{patient.attachments}</Text>
//         {patient.photos && patient.photos.map((src, idx) => (
//           <Image key={idx} source={{ uri: src }} style={{ width: 120, height: 80, marginVertical: 8, borderRadius: 8 }} />
//         ))}
//         <Button title="Generate & Download PDF" onPress={generatePDF} />
//       </View>
//     </ScrollView>
//   );
// };

// export default AllergySummaryReport;
