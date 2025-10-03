import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';

interface VideoViewerModalProps {
  visible: boolean;
  videos: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  watermarkText?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoViewerModal: React.FC<VideoViewerModalProps> = ({
  visible,
  videos,
  currentIndex,
  onClose,
  onIndexChange,
  watermarkText,
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(currentIndex);

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  };

  const handleClose = () => {
    setCurrentVideoIndex(currentIndex);
    onClose();
  };

  if (!visible || videos.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.counterContainer}>
            <Text style={styles.counter}>
              {currentVideoIndex + 1} of {videos.length}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Video Container */}
        <View style={styles.videoContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              if (index !== currentVideoIndex && index >= 0 && index < videos.length) {
                setCurrentVideoIndex(index);
                onIndexChange?.(index);
              }
            }}
            contentOffset={{ x: currentVideoIndex * screenWidth, y: 0 }}
          >
            {videos.map((uri, index) => (
              <VideoItem
                key={index}
                uri={uri}
              />
            ))}
          </ScrollView>
        </View>

        {/* Watermark Below Video */}
        {watermarkText && (
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>{watermarkText}</Text>
          </View>
        )}

        {/* Navigation Buttons */}
        {videos.length > 1 && (
          <>
            {currentVideoIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.previousButton]}
                onPress={handlePrevious}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {currentVideoIndex < videos.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNext}
              >
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Thumbnail Strip */}
        {videos.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {videos.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    index === currentVideoIndex && styles.activeThumbnail,
                  ]}
                  onPress={() => {
                    setCurrentVideoIndex(index);
                    onIndexChange?.(index);
                  }}
                >
                  <VideoView
                    player={useVideoPlayer(uri, (player) => {
                      player.loop = false;
                      player.muted = true;
                    })}
                    style={styles.thumbnailVideo}
                    allowsPictureInPicture={false}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

// Separate component for video items to fix hooks order
const VideoItem = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  return (
    <View style={styles.videoWrapper}>
      <VideoView
        player={player}
        style={styles.video}
        allowsPictureInPicture={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.s,
  },
  closeButton: {
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  counterContainer: {
    alignItems: 'center',
  },
  counter: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
    marginBottom: SPACING.s,
  },
  videoWrapper: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  previousButton: {
    left: SPACING.m,
  },
  nextButton: {
    right: SPACING.m,
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    height: 80,
  },
  thumbnailScrollContent: {
    paddingHorizontal: SPACING.m,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.s,
    marginHorizontal: SPACING.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  watermarkText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.caption,
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 16,
  },
});

export default VideoViewerModal;
