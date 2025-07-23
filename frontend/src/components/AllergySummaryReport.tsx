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
      import('./MobilePDFGenerator')
        .then(module => {
          if (module && module.default) {
            setMobilePDFComponent(() => module.default);
          } else {
            console.error('MobilePDFGenerator module loaded but no default export found:', module);
          }
        })
        .catch(err => {
          console.error('Failed to load mobile PDF component:', err);
        });
    }
  }, []);  const generatePDF = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== "undefined") {
        console.log('Starting PDF generation on web...');
        
        // Load libraries via CDN for web compatibility
        const loadScript = (src: string) => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              console.log(`Script already loaded: ${src}`);
              resolve(true);
              return;
            }
            console.log(`Loading script: ${src}`);
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
              console.log(`Script loaded successfully: ${src}`);
              resolve(true);
            };
            script.onerror = (error) => {
              console.error(`Failed to load script: ${src}`, error);
              reject(error);
            };
            document.head.appendChild(script);
          });
        };

        try {
          // Load jsPDF and html2canvas from CDN
          console.log('Loading jsPDF...');
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
          console.log('Loading html2canvas...');
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
          
          console.log('Checking for loaded libraries...');
          
          // Check if libraries are loaded
          if (!(window as any).jspdf) {
            throw new Error('jsPDF library failed to load');
          }
          if (!(window as any).html2canvas) {
            throw new Error('html2canvas library failed to load');
          }

          const jsPDF = (window as any).jspdf.jsPDF;
          const html2canvas = (window as any).html2canvas;
          
          console.log('Libraries loaded successfully, generating PDF...');
          
          const input = reportRef.current;
          if (!input) {
            throw new Error("Could not find report content to export.");
          }
          
          console.log('Capturing content with html2canvas...');
          const canvas = await html2canvas(input, {
            useCORS: true,
            allowTaint: true,
            scale: 2
          });
          
          console.log('Creating PDF...');
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          
          const fileName = `${patient.name.replace(/[^a-zA-Z0-9]/g, "_")}_AllergySummary.pdf`;
          console.log(`Saving PDF as: ${fileName}`);
          pdf.save(fileName);
          
          window.alert("PDF has been downloaded to your device.");
          console.log('PDF generation completed successfully');
          
        } catch (libraryError) {
          console.error('Error loading libraries or generating PDF:', libraryError);
          throw new Error(`PDF generation failed: ${libraryError.message}`);
        }
        
      } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Mobile platforms - use the dedicated mobile PDF component
        Alert.alert("Info", "Please use the 'Generate PDF' button below for mobile PDF generation.");
      } else {
        Alert.alert("Error", "PDF generation is not supported on this platform.");
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      if (typeof window !== "undefined") {
        window.alert("Failed to generate PDF: " + (err?.message || err));
      } else {
        Alert.alert("Error", err?.message || "Failed to generate report.");
      }
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
        {/* Use the dedicated mobile PDF generator component for all PDF actions on mobile */}
        {MobilePDFComponent && <MobilePDFComponent patient={patient} />}
      </View>
    );
  }

  // For web platforms, render the web-specific PDF UI
  if (Platform.OS === 'web') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#f5f5f5', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: '32px 0 8px 0' }}>Allergy Summary Report</h2>
        <div style={{ width: '100%', maxWidth: 600, backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} ref={reportRef}>
          <div><b>Patient:</b> {patient.name}</div>
          <div>Date of Birth: {patient.dob}</div>
          <div>Parent/Guardian: {patient.guardian}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Diagnosed and Suspected Allergies</div>
          <div>{patient.allergies}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Allergy Testing</div>
          <div>{patient.testing}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Reaction History</div>
          <div>{patient.reactions}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Eczema & Related History</div>
          <div>{patient.eczema}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Current Management Plan</div>
          <div>{patient.management}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Upcoming Plans</div>
          <div>{patient.upcoming}</div>
          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Attachments</div>
          <div>{patient.attachments}</div>
          {patient.photos && patient.photos.map((src, idx) => (
            <img key={idx} src={src} style={{ width: 120, height: 80, margin: '8px 0', borderRadius: 8 }} alt={`photo-${idx}`} />
          ))}
          <div style={{ height: 16 }} />
          <button onClick={generatePDF} style={{ padding: '10px 20px', fontSize: 16, borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer' }}>Generate & Download PDF</button>
        </div>
      </div>
    );
  }

  return null;
};

export default AllergySummaryReport;