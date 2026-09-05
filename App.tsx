import { t, initializeLanguage, useLanguage } from './src/i18n';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { openDatabaseSync } from 'expo-sqlite';
import { Repository } from './src/data/repository';
import { ErrorBoundary } from './src/ui/ErrorBoundary';
import { RepositoryContext } from './src/data/context';
import { HomeScreen } from './src/screens/HomeScreen';
import { KitScreen } from './src/screens/KitScreen';
import { EquipmentScreen } from './src/screens/EquipmentScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { ReturnCheckScreen } from './src/screens/ReturnCheckScreen';
import { Failure, Loading, message } from './src/ui/components';
import { colors, styles as s } from './src/ui/theme';
import type { Routes } from './src/navigation';
const Stack = createNativeStackNavigator<Routes>();
export default function App() {
  const language = useLanguage();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    try {
      initializeLanguage();
      const repository = new Repository(openDatabaseSync('kitback.db'));
      repository.initialize();
      setRepo(repository);
      setError(null);
    } catch (e) {
      setError(message(e));
    }
  }, [attempt]);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {repo ? (
        <SafeAreaView edges={['bottom']} style={s.page}>
          <ErrorBoundary>
            <RepositoryContext.Provider value={repo}>
              <NavigationContainer
                key={language}
                theme={{
                  ...DefaultTheme,
                  colors: {
                    ...DefaultTheme.colors,
                    primary: colors.green,
                    background: colors.bg,
                    card: colors.bg,
                    text: colors.text,
                    border: colors.line,
                  },
                }}
              >
                <Stack.Navigator
                  screenOptions={{
                    headerShadowVisible: false,
                    headerTitleStyle: { fontSize: 17, fontWeight: '600' },
                    headerTintColor: colors.text,
                    headerStyle: { backgroundColor: colors.bg },
                    contentStyle: { backgroundColor: colors.bg },
                  }}
                >
                  <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'KitBack' }} />
                  <Stack.Screen name="Kit" component={KitScreen} options={{ title: t('Kit') }} />
                  <Stack.Screen
                    name="Equipment"
                    component={EquipmentScreen}
                    options={{ title: t('Equipment') }}
                  />
                  <Stack.Screen
                    name="Session"
                    component={SessionScreen}
                    options={{ title: t('Shoot status') }}
                  />
                  <Stack.Screen
                    name="ReturnCheck"
                    component={ReturnCheckScreen}
                    options={{ title: t('Return check') }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </RepositoryContext.Provider>
          </ErrorBoundary>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={s.page}>
          <View style={s.content}>
            <Text style={s.title}>KitBack</Text>
            {error ? (
              <Failure
                message={t('Could not open your local data. ') + error}
                retry={() => setAttempt((x) => x + 1)}
              />
            ) : (
              <Loading />
            )}
          </View>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}
