import { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, PanResponder, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
}

export function BottomSheet({ visible, onClose, children, snapPoints = [SHEET_HEIGHT, SCREEN_HEIGHT * 0.4], initialSnap = 1 }: BottomSheetProps) {
  const { colors, borderRadius: br } = useTheme();
  const translateY = useRef(new Animated.Value(snapPoints[initialSnap] || snapPoints[1])).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 100,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 120,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: backdropOpacity }]}
        >
          <View style={{ flex: 1 }} onTouchEnd={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: br.xl,
            borderTopRightRadius: br.xl,
            minHeight: snapPoints[snapPoints.length - 1],
            maxHeight: snapPoints[0],
            transform: [{ translateY }],
            paddingBottom: 34,
          }}
        >
          <View {...panResponder.panHandlers}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.outline,
              }} />
            </View>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
