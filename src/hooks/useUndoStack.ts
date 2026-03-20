import { useCallback, useRef, useState } from 'react';

interface UndoEntry<T> {
  desc: string;
  snapshot: T;
}

export function useUndoStack<T>(maxDepth = 20) {
  const stackRef = useRef<UndoEntry<T>[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [lastDesc, setLastDesc] = useState('');

  const push = useCallback((desc: string, snapshot: T) => {
    stackRef.current.push({ desc, snapshot });
    if (stackRef.current.length > maxDepth) {
      stackRef.current.shift();
    }
    setCanUndo(true);
    setLastDesc(desc);
  }, [maxDepth]);

  const pop = useCallback((): UndoEntry<T> | null => {
    const entry = stackRef.current.pop() ?? null;
    setCanUndo(stackRef.current.length > 0);
    return entry;
  }, []);

  const clear = useCallback(() => {
    stackRef.current = [];
    setCanUndo(false);
    setLastDesc('');
  }, []);

  return { push, pop, canUndo, lastDesc, clear };
}
