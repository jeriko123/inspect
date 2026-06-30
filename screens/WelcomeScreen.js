import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Trees, User, Languages } from "lucide-react-native";
import { useAppStore } from "../store/useAppStore";
import { EMERALD_COLOR, ZINC_COLOR } from "../store/const";

const schema = z.object({
  name: z.string().trim().min(2, { message: "welcome.validationError" }),
});

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const setInspectorName = useAppStore((state) => state.setInspectorName);
  const currentLanguage = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data) => {
    setInspectorName(data.name);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-zinc-950"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-grow justify-center px-6 py-12">
          {/* Logo Section */}
          <View className="items-center mb-10">
            <View className="bg-emerald-600/10 p-5 rounded-full mb-4 border border-emerald-500/20">
              <Trees size={64} color={EMERALD_COLOR} />
            </View>
            <Text className="text-3xl font-extrabold text-white text-center tracking-tight">
              {t("welcome.title")}
            </Text>
            <Text className="text-sm font-medium text-zinc-400 text-center mt-2 px-4 leading-relaxed">
              {t("welcome.subtitle")}
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl gap-y-4">
            {/* Language Selector */}
            <View className="gap-y-3">
              <View className="flex-row items-center gap-x-2">
                <Languages size={18} color={ZINC_COLOR} />
                <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {t("welcome.selectLanguage")}
                </Text>
              </View>
              <View className="flex-row gap-x-3">
                <TouchableOpacity
                  onPress={() => setLanguage("ru")}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-4 rounded-xl border items-center ${
                    currentLanguage === "ru"
                      ? "bg-emerald-600/10 border-emerald-500"
                      : "bg-zinc-800/50 border-zinc-700"
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${currentLanguage === "ru" ? "text-emerald-400" : "text-zinc-400"}`}
                  >
                    Русский
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage("uz")}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-4 rounded-xl border items-center ${
                    currentLanguage === "uz"
                      ? "bg-emerald-600/10 border-emerald-500"
                      : "bg-zinc-800/50 border-zinc-700"
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${currentLanguage === "uz" ? "text-emerald-400" : "text-zinc-400"}`}
                  >
                    O'zbekcha
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Inspector Name Input */}
            <View className="gap-y-3">
              <View className="flex-row items-center gap-x-2">
                <User size={18} color={ZINC_COLOR} />
                <Text className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {t("welcome.inspectorName")}
                </Text>
              </View>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder={t("welcome.placeholderName")}
                      placeholderTextColor="#71717a"
                      className={`w-full bg-zinc-950 text-white border rounded-xl py-3 px-4 font-medium text-base ${
                        errors.name
                          ? "border-red-500"
                          : "border-zinc-800 focus:border-emerald-500"
                      }`}
                    />
                  </View>
                )}
              />
              {errors.name && (
                <Text className="text-xs font-medium text-red-500 mt-1">
                  {t(errors.name.message)}
                </Text>
              )}
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
              className="w-full bg-emerald-600 py-4 rounded-xl shadow-lg shadow-emerald-600/20 active:bg-emerald-700 items-center justify-center mt-2"
            >
              <Text className="text-white text-base font-bold tracking-wide">
                {t("welcome.continue")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
