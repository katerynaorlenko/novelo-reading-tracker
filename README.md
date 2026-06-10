Novelo

Novelo to mobilna aplikacja do zarządzania osobistą biblioteką i śledzenia postępów czytania. Projekt został wykonany w technologii React Native z użyciem Expo.

Aplikacja pozwala dodawać książki, zapisywać postęp czytania, tworzyć notatki, ustawiać cele czytelnicze oraz analizować własne statystyki.

Funkcjonalności
Biblioteka
dodawanie nowych książek,
wyświetlanie listy książek,
filtrowanie książek według statusu,
wyszukiwanie po tytule, autorze lub gatunku,
sortowanie według daty, postępu, oceny i tytułu,
usuwanie książki z potwierdzeniem.
Szczegóły książki
podgląd informacji o książce,
zmiana statusu: planned, reading, finished,
aktualizacja postępu czytania,
ocena książki,
historia aktywności czytelniczej,
zapisywanie notatek, ulubionego cytatu i krótkiego podsumowania.
Statystyki
liczba wszystkich książek,
liczba książek ukończonych,
procent ukończenia biblioteki,
liczba przeczytanych stron,
średni postęp czytania,
najczęściej występujący gatunek,
aktualna seria czytania,
postęp celu rocznego.
Profil
edycja danych profilu,
zapis ulubionego gatunku,
podgląd preferencji czytelniczych.
Ustawienia
ustawianie celu rocznego,
ustawianie dziennego celu stron,
konfiguracja preferencji czytania,
przypomnienia o czytaniu.
Technologie

Projekt wykorzystuje:

React Native,
Expo,
Expo Router,
TypeScript,
Redux Toolkit,
AsyncStorage,
Expo Notifications,
ESLint,
Prettier.
Architektura aplikacji

Aplikacja została zbudowana z wykorzystaniem podejścia komponentowego oraz Redux Toolkit do zarządzania stanem globalnym.

Stan globalny obejmuje dane współdzielone w aplikacji, takie jak książki i podstawowe dane biblioteki. Stan lokalny jest wykorzystywany w formularzach, filtrach, przełącznikach i tymczasowych elementach interfejsu.

Nawigacja została zaimplementowana przy użyciu Expo Router. Projekt wykorzystuje:

nawigację zakładkową dla głównych ekranów,
nawigację stosu dla szczegółów książki,
ekran modalny do dodawania książek.
Funkcje natywne urządzenia

Aplikacja wykorzystuje funkcje natywne urządzenia:

lokalne przechowywanie danych przy użyciu AsyncStorage,
lokalne powiadomienia przy użyciu Expo Notifications.

Dzięki AsyncStorage aplikacja działa także w trybie offline, ponieważ dane użytkownika są przechowywane lokalnie na urządzeniu.

Obsługa błędów

Projekt zawiera komponent Error Boundary, który przechwytuje nieoczekiwane błędy renderowania i wyświetla użytkownikowi prosty ekran awaryjny zamiast całkowitego zamknięcia aplikacji.

Uruchomienie projektu

1. Klonowanie repozytorium
   git clone <adres-repozytorium>
2. Przejście do folderu projektu
   cd novelo
3. Instalacja zależności
   npm install
4. Uruchomienie aplikacji
   npx expo start

Aplikację można uruchomić w Expo Go przez zeskanowanie kodu QR.

W przypadku problemów z połączeniem można użyć:

1. npx expo start --tunnel --clear
2. npx expo start --host lan

Testowanie jakości kodu

Aby uruchomić ESLint:

npx expo lint

Struktura projektu
app/
(tabs)/
index.tsx
statistics.tsx
profile.tsx
settings.tsx
book/
[id].tsx
modal.tsx
\_layout.tsx

src/
components/
features/
store/
utils/

assets/
Tryb offline

Aplikacja obsługuje podstawowy tryb offline. Dane książek, notatek, postępów czytania, profilu i ustawień są zapisywane lokalnie na urządzeniu.

Autor

Kateryna Orlenko
