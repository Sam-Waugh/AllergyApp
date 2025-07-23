// Web-specific empty component for MobilePDFGenerator
import React from 'react';
import { View, Text } from 'react-native';

interface MobilePDFGeneratorProps {
  patient: any;
}

const MobilePDFGenerator: React.FC<MobilePDFGeneratorProps> = ({ patient }) => {
  return (
    <View>
      <Text>PDF generation not supported on web platform</Text>
    </View>
  );
};

export default MobilePDFGenerator;
