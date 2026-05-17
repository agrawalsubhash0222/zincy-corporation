import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useHomeAnimation() {
  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(move, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, move]);

  return {
    fade,
    move,
  };
}