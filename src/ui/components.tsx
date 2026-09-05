import { t } from '../i18n';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors, styles as s } from './theme';
import { photoUri } from '../data/photos';
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  accent = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        accent && { backgroundColor: colors.accent },
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  ...props
}: TextInputProps & {
  label: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={s.input}
        selectionColor={colors.green}
        {...props}
      />
    </View>
  );
}
export function Failure({ message, retry }: { message: string | null; retry?: () => void }) {
  if (!message) return null;
  return (
    <View style={s.error} accessibilityLiveRegion="polite">
      <Text style={s.errorText}>{t(message)}</Text>
      {retry && <Button title={t('Try again')} secondary onPress={retry} />}
    </View>
  );
}
export function Loading() {
  return <ActivityIndicator style={{ padding: 32 }} color={colors.green} size="large" />;
}
export function GearPhoto({ photo }: { photo: string | null }) {
  return photo ? (
    <Image
      source={{ uri: photoUri(photo) }}
      style={s.photo}
      accessibilityLabel={t('Equipment photo')}
    />
  ) : (
    <View style={[s.photo, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: colors.muted, fontSize: 23 }}>◇</Text>
    </View>
  );
}
export function message(error: unknown): string {
  return error instanceof Error ? t(error.message) : t('Something went wrong. Please try again.');
}
