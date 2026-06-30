import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import {
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Info,
  Plus,
} from "lucide-react-native";
import { useAppStore } from "../store/useAppStore";
import { addObservation } from "../db/database";
import { EMERALD_COLOR, ZINC_COLOR } from "../store/const";

const schema = z.object({
  date: z.string().min(1, "add.validation.date"),
  time: z.string().min(1, "add.validation.time"),
  species: z
    .string()
    .min(1, "add.validation.species")
    .refine((val) => val !== "select_placeholder", {
      message: "add.validation.species",
    }),
  count: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number({ invalid_type_error: "add.validation.count" })
        .positive("add.validation.count"),
    ),
  latitude: z.union([z.number(), z.nan(), z.null()]).optional(),
  longitude: z.union([z.number(), z.nan(), z.null()]).optional(),
  notes: z.string().optional(),
});

const SPECIES_OPTIONS = [
  "tortoise",
  "lizard",
  "water_snake",
  "steppe_ribbon_snake",
  "tatary_sand_boa",
  "glass_lizard",
  "pallass_coluber",
  "white_stork",
  "black_stork",
  "common_pheasant",
  "tolai_hare",
  "jackal",
  "karagan_fox",
  "steppe_cat",
  "jungle_cat",
  "badger",
  "deer",
];

export default function AddObservationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const inspectorName = useAppStore((state) => state.inspectorName);

  const [dateVal, setDateVal] = useState(new Date());
  const [timeVal, setTimeVal] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Form setup
  const defaultDateStr = new Date().toISOString().split("T")[0];
  const defaultTimeStr = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: defaultDateStr,
      time: defaultTimeStr,
      species: "select_placeholder",
      count: "",
      latitude: null,
      longitude: null,
      notes: "",
    },
  });

  const watchLatitude = watch("latitude");
  const watchLongitude = watch("longitude");

  // Handle Date Selection
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDateVal(selectedDate);
      const formatted = selectedDate.toISOString().split("T")[0];
      setValue("date", formatted);
    }
  };

  // Handle Time Selection
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setTimeVal(selectedTime);
      const hours = String(selectedTime.getHours()).padStart(2, "0");
      const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
      setValue("time", `${hours}:${minutes}`);
    }
  };

  // Fetch Device GPS Coordinates
  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("add.coordsLabel"), t("add.gpsDenied"));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (location && location.coords) {
        setValue("latitude", location.coords.latitude);
        setValue("longitude", location.coords.longitude);
      } else {
        Alert.alert(t("add.coordsLabel"), t("add.gpsError"));
      }
    } catch (error) {
      console.error("Error fetching GPS location:", error);
      Alert.alert(t("add.coordsLabel"), t("add.gpsError"));
    } finally {
      setIsLocating(false);
    }
  };

  // Save Observation Form
  const onSubmit = async (data) => {
    try {
      addObservation({
        date: data.date,
        time: data.time,
        inspector_name: inspectorName,
        species: data.species,
        count: data.count,
        latitude: data.latitude,
        longitude: data.longitude,
        notes: data.notes,
      });

      Alert.alert(t("add.title"), t("add.successSave"), [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to save observation:", error);
      Alert.alert(t("add.title"), "Failed to save record");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-950"
    >
      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="gap-y-5">
          {/* Date & Time Row */}
          <View className="flex-row gap-x-3">
            {/* Date Input */}
            <View className="flex-1 gap-y-2">
              <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("add.date")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                className="flex-row items-center gap-x-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800/80"
              >
                <Calendar size={18} color={EMERALD_COLOR} />
                <Controller
                  control={control}
                  name="date"
                  render={({ field: { value } }) => (
                    <Text className="text-white text-base font-semibold">
                      {value}
                    </Text>
                  )}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateVal}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Time Input */}
            <View className="flex-1 gap-y-2">
              <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t("add.time")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
                className="flex-row items-center gap-x-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800/80"
              >
                <Clock size={18} color={EMERALD_COLOR} />
                <Controller
                  control={control}
                  name="time"
                  render={({ field: { value } }) => (
                    <Text className="text-white text-base font-semibold">
                      {value}
                    </Text>
                  )}
                />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={timeVal}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={onTimeChange}
                />
              )}
            </View>
          </View>

          {/* Species Dropdown Selector */}
          <View className="gap-y-2">
            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t("add.speciesLabel")}
            </Text>
            <View className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <Controller
                control={control}
                name="species"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    dropdownIconColor="#10b981"
                    style={{ color: "#ffffff", backgroundColor: "transparent" }}
                  >
                    <Picker.Item
                      label={t("add.selectSpecies")}
                      value="select_placeholder"
                      color="#71717a"
                    />
                    {SPECIES_OPTIONS.map((item) => (
                      <Picker.Item
                        key={item}
                        label={t(`species.${item}`)}
                        value={item}
                        color={Platform.OS === "ios" ? "#ffffff" : "#000000"}
                      />
                    ))}
                  </Picker>
                )}
              />
            </View>
            {errors.species && (
              <Text className="text-xs font-medium text-red-500">
                {t(errors.species.message)}
              </Text>
            )}
          </View>

          {/* Quantity Count Input */}
          <View className="gap-y-2">
            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t("add.countLabel")}
            </Text>
            <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-1">
              <Info size={18} color={EMERALD_COLOR} className=" mr-2" />
              <Controller
                control={control}
                name="count"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder={t("add.countPlaceholder")}
                    placeholderTextColor="#71717a"
                    keyboardType="number-pad"
                    className="flex-1 text-white py-2.5 font-semibold text-base"
                  />
                )}
              />
            </View>
            {errors.count && (
              <Text className="text-xs font-medium text-red-500">
                {t(errors.count.message)}
              </Text>
            )}
          </View>

          {/* Location GPS Section */}
          <View className="gap-y-3">
            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t("add.coordsLabel")}
            </Text>
            <View className="flex-row gap-x-3">
              {/* Latitude Input */}
              <View className="flex-1 bg-zinc-900/50 border border-zinc-850 rounded-xl px-4 py-3 flex-row items-center justify-between">
                <Text className="text-xs font-bold text-zinc-500">LAT</Text>
                <Text className="text-white text-base font-semibold">
                  {watchLatitude != null ? watchLatitude.toFixed(5) : "—"}
                </Text>
              </View>
              {/* Longitude Input */}
              <View className="flex-1 bg-zinc-900/50 border border-zinc-850 rounded-xl px-4 py-3 flex-row items-center justify-between">
                <Text className="text-xs font-bold text-zinc-500">LON</Text>
                <Text className="text-white text-base font-semibold">
                  {watchLongitude != null ? watchLongitude.toFixed(5) : "—"}
                </Text>
              </View>
            </View>

            {/* GPS Fetch Button */}
            <TouchableOpacity
              onPress={fetchLocation}
              disabled={isLocating}
              activeOpacity={0.8}
              className="w-full border border-emerald-600/30 bg-emerald-600/10 py-3.5 rounded-xl items-center justify-center flex-row gap-x-2 active:bg-emerald-600/20 disabled:opacity-50"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <>
                  <MapPin size={18} color={EMERALD_COLOR} />
                  <Text className="text-emerald-400 text-sm font-bold">
                    {t("add.getCoords")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Notes Input */}
          <View className="gap-y-2">
            <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t("add.notesLabel")}
            </Text>
            <View className="flex-row items-start bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <AlignLeft
                size={18}
                color={EMERALD_COLOR}
                className="ml-2 mt-1"
              />
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder={t("add.notesPlaceholder")}
                    placeholderTextColor="#71717a"
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="flex-1 text-white py-1 font-medium text-sm min-h-[80px]"
                  />
                )}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
            className="w-full bg-emerald-600 py-4 rounded-xl items-center justify-center shadow-lg shadow-emerald-500/20 active:bg-emerald-700 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-extrabold tracking-wide uppercase">
                {t("add.saveButton")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
