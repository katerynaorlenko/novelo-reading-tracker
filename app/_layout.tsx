import { Stack } from "expo-router";
import { Provider } from "react-redux";

import ErrorBoundary from "../src/components/ErrorBoundary";
import { store } from "../src/store/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="book/[id]"
            options={{
              title: "Book Details",
              headerBackTitle: "Back",
              headerTitleAlign: "center",
              headerShadowVisible: false,
            }}
          />

          <Stack.Screen
            name="modal"
            options={{
              title: "Add Book",
              presentation: "modal",
              headerTitleAlign: "center",
              headerShadowVisible: false,
            }}
          />
        </Stack>
      </ErrorBoundary>
    </Provider>
  );
}
