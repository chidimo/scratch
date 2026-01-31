import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme.preference'
const listeners = new Set<(value: ThemePreference) => void>()
let cachedPreference: ThemePreference = 'system'
let loaded = false

const notify = () => {
  for (const listener of listeners) {
    listener(cachedPreference)
  }
}

export const getCachedThemePreference = () => cachedPreference

export const isThemePreferenceLoaded = () => loaded

export const subscribeThemePreference = (
  listener: (value: ThemePreference) => void,
) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const loadThemePreference = async () => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    cachedPreference = stored
  }
  loaded = true
  notify()
  return cachedPreference
}

export const setThemePreference = async (value: ThemePreference) => {
  cachedPreference = value
  loaded = true
  notify()
  await AsyncStorage.setItem(STORAGE_KEY, value)
}
