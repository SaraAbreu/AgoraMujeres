import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { OPTIONS } from "../../../constants/options";

interface SectionCardProps {
  sectionKey: keyof typeof OPTIONS;
  selections: string[];
  onToggle: (key: keyof typeof OPTIONS, tag: string) => void;
}

export function SectionCard({ sectionKey, selections, onToggle }: SectionCardProps) {
  const items = OPTIONS[sectionKey];

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
        {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => {
          const active = selections.includes(item);

          return (
            <TouchableOpacity
              key={item}
              onPress={() => onToggle(sectionKey, item)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: active ? "#2F4F4F" : "#CCC",
                backgroundColor: active ? "#2F4F4F" : "white",
              }}
            >
              <Text
                style={{
                  color: active ? "white" : "#333",
                  fontSize: 14,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
