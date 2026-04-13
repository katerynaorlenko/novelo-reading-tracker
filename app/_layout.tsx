import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="book/[id]"
        options={{
          title: "Book Details",
        }}
      />
    </Stack>
  );
}
