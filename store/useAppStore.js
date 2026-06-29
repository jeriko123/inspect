import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n'; // we will create this soon

export const useAppStore = create(
  persist(
    (set, get) => ({
      inspectorName: '',
      language: 'ru', // default language
      
      setInspectorName: (name) => set({ inspectorName: name }),
      
      clearInspectorName: () => set({ inspectorName: '' }),
      
      setLanguage: (lang) => {
        set({ language: lang });
        if (i18n && i18n.changeLanguage) {
          i18n.changeLanguage(lang);
        }
      },
    }),
    {
      name: 'inspect-app-storage', // unique name
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Sync language with i18n on store load/rehydration
        if (state && state.language && i18n && i18n.changeLanguage) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
