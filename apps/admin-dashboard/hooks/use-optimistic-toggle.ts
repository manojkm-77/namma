'use client';

import { useState, useCallback } from 'react';

export function useOptimisticToggle(
  initialState: boolean,
  onToggle?: (newState: boolean) => Promise<void> | void
) {
  const [optimisticState, setOptimisticState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(() => {
    const newState = !optimisticState;
    setOptimisticState(newState);

    if (onToggle) {
      setIsPending(true);
      const result = onToggle(newState);
      if (result instanceof Promise) {
        result.catch(() => {
          setOptimisticState(!newState);
        }).finally(() => {
          setIsPending(false);
        });
      } else {
        setIsPending(false);
      }
    }
  }, [optimisticState, onToggle]);

  return { state: optimisticState, toggle, isPending };
}
