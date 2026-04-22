import { Tabs } from "expo-router";
import AnimatedTabBar from "../../src/components/AnimatedTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
        tabBarStyle: {
          display: "none",
        },
      }}
    >
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
