import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const BAR_HORIZONTAL_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - BAR_HORIZONTAL_MARGIN * 2;
const TAB_COUNT = 3;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

const tabs = [
  {
    key: "index",
    label: "Library",
    activeIcon: "library" as const,
    inactiveIcon: "library-outline" as const,
  },
  {
    key: "statistics",
    label: "Statistics",
    activeIcon: "stats-chart" as const,
    inactiveIcon: "stats-chart-outline" as const,
  },
  {
    key: "settings",
    label: "Settings",
    activeIcon: "settings" as const,
    inactiveIcon: "settings-outline" as const,
  },
];

export default function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const currentRoute = state.routes[state.index];
    const currentTabIndex = tabs.findIndex(
      (tab) => tab.key === currentRoute.name,
    );

    Animated.spring(translateX, {
      toValue: currentTabIndex * TAB_WIDTH,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [state.index, state.routes, translateX]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.activeBackground,
            {
              transform: [{ translateX }],
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;

          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;

          const isFocused = state.index === index;
          const tabConfig = tabs.find((tab) => tab.key === route.name);

          if (!tabConfig) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <Ionicons
                name={isFocused ? tabConfig.activeIcon : tabConfig.inactiveIcon}
                size={22}
                color={isFocused ? "#FFFFFF" : "#6B7280"}
              />

              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },

  container: {
    width: TAB_BAR_WIDTH,
    height: 78,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },

  activeBackground: {
    position: "absolute",
    width: TAB_WIDTH - 32,
    height: 56,
    top: 11,
    left: 16,
    borderRadius: 999,
    backgroundColor: "#6C63FF",
    shadowColor: "#6C63FF",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },

  tabButton: {
    width: TAB_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 2,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  tabLabelActive: {
    color: "#FFFFFF",
  },

  tabLabelInactive: {
    color: "#6B7280",
  },
});
