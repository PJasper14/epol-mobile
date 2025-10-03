import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { 
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';

interface PhotoViewerModalProps {
  visible: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  watermarkText?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  images,
  currentIndex,
  onClose,
  onIndexChange,
  watermarkText,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);
  
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  };

  const handleClose = () => {
    setCurrentImageIndex(currentIndex);
    resetZoom();
    onClose();
  };

  const resetZoom = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
  };

  const onPinchGestureEvent = (event: any) => {
    const newScale = Math.max(1, Math.min(3, lastScale * event.nativeEvent.scale));
    setScale(newScale);
  };

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setLastScale(scale);
    }
  };

  const onPanGestureEvent = (event: any) => {
    if (scale > 1) {
      const newTranslateX = lastTranslateX + event.nativeEvent.translationX;
      const newTranslateY = lastTranslateY + event.nativeEvent.translationY;
      
      // Limit panning to prevent image from going too far off screen
      const maxTranslateX = (screenWidth * (scale - 1)) / 2;
      const maxTranslateY = (screenHeight * (scale - 1)) / 2;
      
      setTranslateX(Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX)));
      setTranslateY(Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY)));
    }
  };

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setLastTranslateX(translateX);
      setLastTranslateY(translateY);
    }
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
      setLastScale(2);
    }
  };

  if (!visible || images.length === 0) {
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
      <GestureHandlerRootView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.counterContainer}>
            <Text style={styles.counter}>
              {currentImageIndex + 1} of {images.length}
            </Text>
            {scale > 1 && (
              <Text style={styles.zoomIndicator}>
                {Math.round(scale * 100)}%
              </Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
                          onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                if (index !== currentImageIndex && index >= 0 && index < images.length) {
                  setCurrentImageIndex(index);
                  onIndexChange?.(index);
                  resetZoom(); // Reset zoom when changing images
                }
              }}
            contentOffset={{ x: currentImageIndex * screenWidth, y: 0 }}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <PanGestureHandler
                  ref={panRef}
                  onGestureEvent={onPanGestureEvent}
                  onHandlerStateChange={onPanHandlerStateChange}
                  minPointers={1}
                  maxPointers={1}
                >
                  <PinchGestureHandler
                    ref={pinchRef}
                    onGestureEvent={onPinchGestureEvent}
                    onHandlerStateChange={onPinchHandlerStateChange}
                  >
                    <View style={styles.gestureContainer}>
                      <TouchableOpacity
                        onPress={handleDoubleTap}
                        activeOpacity={1}
                        style={styles.imageTouchable}
                      >
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri }}
                            style={[
                              styles.image,
                              {
                                transform: [
                                  { scale: scale },
                                  { translateX: translateX },
                                  { translateY: translateY },
                                ],
                              },
                            ]}
                            resizeMode="contain"
                          />
                          {watermarkText && (
                            <View style={styles.watermarkOverlay}>
                              <Text style={styles.watermarkText}>{watermarkText}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </PinchGestureHandler>
                </PanGestureHandler>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.previousButton]}
                onPress={handlePrevious}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {currentImageIndex < images.length - 1 && (
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
        {images.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {images.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    index === currentImageIndex && styles.activeThumbnail,
                  ]}
                  onPress={() => {
                    setCurrentImageIndex(index);
                    onIndexChange?.(index);
                  }}
                >
                  <Image source={{ uri }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
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
  zoomIndicator: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  placeholder: {
    width: 44,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
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
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.s,
    borderBottomLeftRadius: BORDER_RADIUS.s,
    borderBottomRightRadius: BORDER_RADIUS.s,
  },
  watermarkText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.caption,
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 16,
  },
});

export default PhotoViewerModal;
