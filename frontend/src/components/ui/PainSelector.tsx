import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface PainSelectorProps {
  value: number;
  onChange: (n: number) => void;
}

export function PainSelector({ value, onChange }: PainSelectorProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {Array.from({ length: 11 }).map((_, i) => {
        const active = value === i;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onChange(i)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: active ? "#2F4F4F" : "#DDD",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: active ? "white" : "#333", fontSize: 12 }}>
              {i}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
