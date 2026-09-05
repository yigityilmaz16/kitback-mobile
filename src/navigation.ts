import type { NativeStackScreenProps } from '@react-navigation/native-stack';
export type Routes = {
  Home: undefined;
  Kit: { kitId: number };
  Equipment: { kitId: number; equipmentId?: number };
  Session: { sessionId: number };
  ReturnCheck: { sessionId: number };
};
export type ScreenProps<T extends keyof Routes> = NativeStackScreenProps<Routes, T>;
