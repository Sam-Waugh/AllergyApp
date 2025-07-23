// Web-only PDF generation component - completely isolated from mobile
import React from 'react';

interface WebPDFGeneratorProps {
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
  reportRef: React.RefObject<any>;
}

const WebPDFGenerator: React.FC<WebPDFGeneratorProps> = ({ patient, reportRef }) => {
  const generatePDF = async () => {
    try {
      // Import only on web and only when function is called
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const input = reportRef.current;
      if (!input) {
        alert("Could not find report content to export.");
        return;
      }
      
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${patient.name.replace(" ", "_")}_AllergySummary.pdf`);
      alert("PDF has been downloaded to your device.");
    } catch (err: any) {
      alert("Failed to generate PDF: " + (err?.message || err));
    }
  };

  return (
    <button 
      onClick={generatePDF}
      style={{ 
        padding: '10px 20px', 
        fontSize: 16, 
        borderRadius: 8, 
        background: '#1976d2', 
        color: '#fff', 
        border: 'none', 
        cursor: 'pointer' 
      }}
    >
      Generate & Download PDF
    </button>
  );
};

export default WebPDFGenerator;
