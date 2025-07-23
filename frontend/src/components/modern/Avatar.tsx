import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';

interface AvatarProps {
  name: string;
  subtitle?: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  subtitle,
  imageUrl,
  size = 'medium',
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeStyles = {
    small: { width: 32, height: 32, borderRadius: 16 },
    medium: { width: 48, height: 48, borderRadius: 24 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const textSizeStyles = {
    small: { fontSize: 12 },
    medium: { fontSize: 16 },
    large: { fontSize: 20 },
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, sizeStyles[size]]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.image, sizeStyles[size]]} />
        ) : (
          <Text style={[styles.initials, textSizeStyles[size]]}>
            {getInitials(name)}
          </Text>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
    color: '#1976D2',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
    color: '#000000',
  },
  subtitle: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
    marginTop: 2,
  },
});

export default Avatar;
