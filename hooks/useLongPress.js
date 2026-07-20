"use client";
import { useCallback, useRef } from 'react';

export const useLongPress = (onLongPress, onClick, { delay = 500 } = {}) => {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const isMovedRef = useRef(false);

  const start = useCallback(
    (e) => {
      isLongPressRef.current = false;
      isMovedRef.current = false;
      timerRef.current = setTimeout(() => {
        if (!isMovedRef.current) {
          isLongPressRef.current = true;
          onLongPress(e);
        }
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (e) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (!isLongPressRef.current && !isMovedRef.current && onClick) {
        onClick(e);
      }
      isLongPressRef.current = false;
      isMovedRef.current = false;
    },
    [onClick]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    isMovedRef.current = true;
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: cancel,
  };
};
