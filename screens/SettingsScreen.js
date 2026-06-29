import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { User, Languages, Database, DownloadCloud, Trash2, CheckCircle2 } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { clearDatabase, importObservations } from '../db/database';

export default function SettingsScreen() {
  const { t } = useTranslation();
  
  const inspectorName = useAppStore((state) => state.inspectorName);
  const setInspectorName = useAppStore((state) => state.setInspectorName);
  const currentLanguage = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [nameVal, setNameVal] = useState(inspectorName);
  const [isImporting, setIsImporting] = useState(false);

  const handleNameChange = (text) => {
    setNameVal(text);
    setInspectorName(text);
  };

  // CSV Parsing helper
  const parseCSVContent = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse header and standardise to lowercase
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cells = [];
      let currentCell = '';
      let insideQuote = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());

      const record = {};
      headers.forEach((header, index) => {
        let cellVal = cells[index] || '';
        // Clean outer wrapping quotes and double internal quotes
        if (cellVal.startsWith('"') && cellVal.endsWith('"')) {
          cellVal = cellVal.slice(1, -1);
        }
        cellVal = cellVal.replace(/""/g, '"');
        record[header] = cellVal;
      });

      // Basic field presence validation
      if (record.date && record.time && record.species && record.count) {
        result.push(record);
      }
    }
    return result;
  };

  // Import CSV Action
  const handleImportCSV = async () => {
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsedRecords = parseCSVContent(content);

      if (parsedRecords.length === 0) {
        Alert.alert(t('settings.title'), t('settings.importError'));
        setIsImporting(false);
        return;
      }

      // Bulk write database records using transaction
      importObservations(parsedRecords);

      Alert.alert(
        t('settings.title'), 
        t('settings.importSuccess', { count: parsedRecords.length })
      );
    } catch (error) {
      console.error('Error importing CSV file:', error);
      Alert.alert(t('settings.title'), t('settings.importError') + ` (${error.message})`);
    } finally {
      setIsImporting(false);
    }
  };

  // Delete all records confirmation flow
  const handleClearDatabase = () => {
    Alert.alert(
      t('settings.confirmClearTitle'),
      t('settings.confirmClearMsg'),
      [
        {
          text: t('settings.cancelBtn'),
          style: 'cancel',
        },
        {
          text: t('settings.confirmBtn'),
          style: 'destructive',
          onPress: () => {
            try {
              clearDatabase();
              Alert.alert(t('settings.title'), t('settings.dbCleared'));
            } catch (error) {
              console.error('Failed to clear DB:', error);
              Alert.alert(t('settings.title'), 'Failed to clear database');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-zinc-950 px-4 py-4">
      <View className="space-y-6" style={{ paddingBottom: 40 }}>
        
        {/* Profile Card Section */}
        <View className="space-y-3">
          <View className="flex-row items-center space-x-2">
            <User size={18} className="text-emerald-500" />
            <Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t('settings.sectionProfile')}
            </Text>
          </View>
          <View className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md space-y-4">
            <View className="space-y-2">
              <Text className="text-xs font-semibold text-zinc-500">
                {t('settings.changeNameLabel')}
              </Text>
              <TextInput
                value={nameVal}
                onChangeText={handleNameChange}
                placeholder={t('settings.namePlaceholder')}
                placeholderTextColor="#71717a"
                className="bg-zinc-950 text-white border border-zinc-800 rounded-xl py-3 px-4 font-semibold text-base focus:border-emerald-500"
              />
            </View>
          </View>
        </View>

        {/* Application Params Section */}
        <View className="space-y-3">
          <View className="flex-row items-center space-x-2">
            <Languages size={18} className="text-emerald-500" />
            <Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t('settings.sectionApp')}
            </Text>
          </View>
          <View className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md space-y-4">
            <View className="space-y-2">
              <Text className="text-xs font-semibold text-zinc-500">
                {t('settings.languageLabel')}
              </Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setLanguage('ru')}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-4 rounded-xl border items-center ${
                    currentLanguage === 'ru'
                      ? 'bg-emerald-600/10 border-emerald-500'
                      : 'bg-zinc-950 border-zinc-850'
                  }`}
                >
                  <Text className={`font-semibold text-sm ${currentLanguage === 'ru' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    Русский
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage('uz')}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-4 rounded-xl border items-center ${
                    currentLanguage === 'uz'
                      ? 'bg-emerald-600/10 border-emerald-500'
                      : 'bg-zinc-950 border-zinc-850'
                  }`}
                >
                  <Text className={`font-semibold text-sm ${currentLanguage === 'uz' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    O'zbekcha
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Database Operations & Danger Zone */}
        <View className="space-y-3">
          <View className="flex-row items-center space-x-2">
            <Database size={18} className="text-emerald-500" />
            <Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t('settings.sectionDanger')}
            </Text>
          </View>
          <View className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md space-y-4">
            
            {/* Import CSV */}
            <TouchableOpacity
              onPress={handleImportCSV}
              disabled={isImporting}
              activeOpacity={0.8}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3.5 px-4 flex-row items-center justify-between active:bg-zinc-850"
            >
              <View className="flex-row items-center space-x-3">
                <DownloadCloud size={20} className="text-zinc-400" />
                <Text className="text-white text-sm font-semibold">
                  {t('settings.importCsv')}
                </Text>
              </View>
              {isImporting ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : null}
            </TouchableOpacity>

            {/* Clear Database (Destructive) */}
            <TouchableOpacity
              onPress={handleClearDatabase}
              activeOpacity={0.8}
              className="w-full bg-red-600/10 border border-red-500/20 rounded-xl py-3.5 px-4 flex-row items-center justify-between active:bg-red-600/20"
            >
              <View className="flex-row items-center space-x-3">
                <Trash2 size={20} className="text-red-500" />
                <Text className="text-red-400 text-sm font-bold">
                  {t('settings.clearDb')}
                </Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}
