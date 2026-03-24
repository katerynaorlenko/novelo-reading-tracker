import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          headerTitle: "Library",
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          headerTitle: "Statistics",
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerTitle: "Settings",
        }}
      />
    </Tabs>
  );
}
