import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store';
import { Colors } from '../constants/Colors';
import { TopBar } from '../components/modern';

export default function ImageDiaryScreen() {
  const [uploading, setUploading] = useState(false);
  const insets = useSafeAreaInsets();
  const token = useAppSelector(state => state.auth.token);
  const childId = useAppSelector(state => state.children.selectedChild?.id);

  const uploadPhoto = async (uri: string, filename: string, type: string) => {
    if (!token || !childId) {
      Alert.alert('Error', 'You must be logged in and have a child selected.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('child_id', childId.toString());
    formData.append('photo_type', 'eczema');
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    try {
      const response = await fetch('http://localhost:8090/api/v1/photos/firebase/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Photo uploaded! URL: ' + data.data.photo_url);
      } else {
        Alert.alert('Upload failed', data.message || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      await uploadPhoto(uri, filename, type);
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      await uploadPhoto(uri, filename, type);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar 
        title="Photos" 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[{ paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Photo</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handlePickFromGallery}>
              <Text style={styles.actionButtonText}>From Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          <Text style={styles.emptyText}>No photos yet. Add your first photo above.</Text>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});
