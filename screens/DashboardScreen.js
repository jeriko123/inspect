import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  Plus,
  Download,
  PawPrint,
  Calendar,
  Clock,
  MapPin,
  User2,
  BookOpen,
} from "lucide-react-native";
import { useObservations } from "../hooks/useObservations";
import { getAllObservationsForExport } from "../db/database";
import { EMERALD_COLOR, ZINC_COLOR } from "../store/const";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { observations, isLoading, isRefreshing, loadMore, refresh } =
    useObservations();

  // Reload data whenever screen is focused (e.g., after returning from Add Screen)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // CSV Export Logic
  const handleExportCSV = useCallback(async () => {
    try {
      const records = getAllObservationsForExport();
      if (records.length === 0) {
        Alert.alert(t("dashboard.emptyTitle"), t("dashboard.emptySubtitle"));
        return;
      }

      // Escape helper for CSV cells
      const escapeCsvVal = (val) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (
          str.includes(",") ||
          str.includes('"') ||
          str.includes("\n") ||
          str.includes("\r")
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Header row
      const headers = [
        "id",
        "date",
        "time",
        "inspector_name",
        "species",
        "count",
        "latitude",
        "longitude",
        "notes",
      ];
      const csvRows = [headers.join(",")];

      // Data rows
      for (const record of records) {
        const row = [
          record.id,
          escapeCsvVal(record.date),
          escapeCsvVal(record.time),
          escapeCsvVal(record.inspector_name),
          escapeCsvVal(record.species),
          record.count,
          record.latitude != null ? record.latitude : "",
          record.longitude != null ? record.longitude : "",
          escapeCsvVal(record.notes),
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      const fileUri = `${FileSystem.cacheDirectory}observations_${Date.now()}.csv`;

      // Write to local temporary cache
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: t("dashboard.title"),
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert(
          t("dashboard.exportError"),
          "Sharing is not available on this device",
        );
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert(t("dashboard.exportError"), error.message);
    }
  }, [t]);

  // Configure navigation header options
  useEffect(() => {
    navigation.setOptions({
      headerTitle: t("dashboard.title"),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleExportCSV}
          activeOpacity={0.7}
          className="p-2 mr-2 bg-emerald-600 rounded-full border border-emerald-500/50 active:bg-emerald-600/20"
        >
          <Download size={20} className="text-emerald-500" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleExportCSV, t]);

  // Render Item for FlatList
  const renderItem = ({ item }) => {
    // Translate species name or fallback to raw
    const speciesTranslationKey = `species.${item.species.toLowerCase()}`;
    const translatedSpecies =
      t(speciesTranslationKey) !== speciesTranslationKey
        ? t(speciesTranslationKey)
        : item.species;

    return (
      <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 shadow-md gap-y-4">
        {/* Card Header */}
        <View className="flex-row justify-between items-center border-b border-zinc-800/80 pb-3">
          <View className="flex-row items-center gap-x-2.5">
            <View className="bg-emerald-600/50 p-2 rounded-xl border border-emerald-500">
              <PawPrint size={18} color="white" />
            </View>
            <Text className="text-lg font-bold text-white tracking-tight">
              {translatedSpecies}
            </Text>
          </View>
          <View className="bg-emerald-600/15 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-emerald-400">
              {t("dashboard.count", { count: item.count })}
            </Text>
          </View>
        </View>

        {/* Card Body Info */}
        <View className="flex-row flex-wrap justify-between ">
          <View className="flex-row items-center gap-x-2 w-[48%]">
            <Calendar size={14} color={ZINC_COLOR} />
            <Text className="text-xs font-semibold text-zinc-400">
              {item.date}
            </Text>
          </View>
          <View className="flex-row items-center gap-x-2 w-[48%]">
            <Clock size={14} color={ZINC_COLOR} />
            <Text className="text-xs font-semibold text-zinc-400">
              {item.time}
            </Text>
          </View>
          {item.latitude != null && item.longitude != null && (
            <View className="flex-row items-center gap-x-2 w-full ">
              <MapPin size={14} color={ZINC_COLOR} />
              <Text className="text-xs font-semibold text-zinc-400">
                {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* Card Notes */}
        {item.notes ? (
          <View className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl flex-row items-start gap-x-2">
            <BookOpen
              size={14}
              color={ZINC_COLOR}
              className="text-zinc-500 mt-0.5"
            />
            <Text className="text-xs font-medium text-zinc-400 flex-1 leading-relaxed">
              {item.notes}
            </Text>
          </View>
        ) : null}

        {/* Inspector Name */}
        <View className="flex-row items-center gap-x-1.5 pt-1">
          <User2 size={12} color={ZINC_COLOR} />
          <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {t("dashboard.inspector", { name: item.inspector_name })}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 justify-center items-center py-20 px-8">
        <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-full mb-4">
          <PawPrint size={48} className="text-zinc-600" />
        </View>
        <Text className="text-lg font-bold text-white text-center">
          {t("dashboard.emptyTitle")}
        </Text>
        <Text className="text-sm font-medium text-zinc-500 text-center mt-2 leading-relaxed">
          {t("dashboard.emptySubtitle")}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-zinc-950 px-4 pt-4">
      <FlatList
        data={observations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshing={isRefreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("AddObservation")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-16 h-16 bg-emerald-600 rounded-full justify-center items-center shadow-lg shadow-emerald-500/30 active:bg-emerald-700"
      >
        <Plus size={30} className="text-white" />
      </TouchableOpacity>
    </View>
  );
}
