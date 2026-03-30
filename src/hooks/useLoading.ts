import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

// A tiny loading registry with subscribe/notify to work across components without prop drilling.
// Usage:
// const loading = useLoadingMap(["syncState","mountUrl","unmount"])
// loading.start("mountUrl"); ... loading.stop("mountUrl");
// await loading.wrap("syncState", somePromise())
// <Button disabled={loading.is("mountUrl")}>...</Button>

export type LoadingKey = string

class LoadingStore {
  private map = new Map<LoadingKey, boolean>()
  private listeners = new Set<() => void>()
  private snapshot: Record<string, boolean> = {}

  subscribe = (l: () => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  // Must be referentially stable when no state changes
  getSnapshot = () => this.snapshot

  private rebuildSnapshot() {
    this.snapshot = Object.fromEntries(this.map.entries())
  }

  ensure(key: LoadingKey, defaultValue = false) {
    if (!this.map.has(key)) {
      this.map.set(key, defaultValue)
      this.rebuildSnapshot()
      this.emit()
    }
  }

  set(key: LoadingKey, val: boolean) {
    const prev = this.map.get(key)
    if (prev === val) return
    this.map.set(key, val)
    this.rebuildSnapshot()
    this.emit()
  }

  emit() {
    for (const l of this.listeners) l()
  }
}

const globalStore = new LoadingStore()

export function useLoadingMap(initialKeys: LoadingKey[] = []) {
  // ensure keys exist in map after mount to avoid setState during render
  useEffect(() => {
    initialKeys.forEach(k => globalStore.ensure(k, false))
  }, [initialKeys])

  const snapshot = useSyncExternalStore(
    globalStore.subscribe,
    globalStore.getSnapshot,
    globalStore.getSnapshot
  )

  const is = useCallback((key: LoadingKey) => !!snapshot[key], [snapshot])
  const any = useMemo(() => Object.values(snapshot).some(Boolean), [snapshot])

  const start = useCallback((key: LoadingKey) => globalStore.set(key, true), [])
  const stop = useCallback((key: LoadingKey) => globalStore.set(key, false), [])
  const set = useCallback(
    (key: LoadingKey, val: boolean) => globalStore.set(key, val),
    []
  )

  const wrap = useCallback(
    async <T>(key: LoadingKey, p: Promise<T>): Promise<T> => {
      start(key)
      try {
        return await p
      } finally {
        stop(key)
      }
    },
    [start, stop]
  )

  const props = useCallback(
    (key: LoadingKey) => ({ loading: is(key), disabled: is(key) }),
    [is]
  )

  return {
    is,
    any,
    start,
    stop,
    set,
    wrap,
    props,
    isLoading: is,
    startLoading: start,
    stopLoading: stop,
  } as const
}
