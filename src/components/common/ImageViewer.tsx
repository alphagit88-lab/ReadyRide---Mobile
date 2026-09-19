import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radii } from '../../theme/shape';

interface ImageViewerProps {
  uri: string | null;
  onClose: () => void;
}

export default function ImageViewer({ uri, onClose }: ImageViewerProps) {
  return (
    <Modal visible={!!uri} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        {uri && (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 25,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.pill,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25
  },
  image: {
    width: '100%',
    height: '80%',
  },
});
