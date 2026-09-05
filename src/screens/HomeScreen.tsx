import { t, setLanguage, useLanguage } from '../i18n';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRepository } from '../data/context';
import { Button, Failure, Field, Loading, message } from '../ui/components';
import { colors, styles as s } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import type { ScreenProps } from '../navigation';
export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const repo = useRepository();
  const language = useLanguage();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const query = useLiveQuery(() => ({
    kits: repo.kits(),
    active: repo.sessions().filter((x) => x.status === 'active'),
  }));
  function create() {
    try {
      const id = repo.addKit(name);
      setName('');
      setError(null);
      query.reload();
      navigation.navigate('Kit', { kitId: id });
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.section}>
        <Text style={s.title}>{t('Your kits')}</Text>
        <View style={[s.row, { gap: 0 }]}>
          {(['tr', 'en'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={value === 'tr' ? 'Türkçe' : 'English'}
              accessibilityState={{ selected: language === value }}
              onPress={() => {
                try {
                  setLanguage(value);
                } catch (e) {
                  setError(message(e));
                }
              }}
              style={{
                padding: 12,
                minHeight: 44,
                borderRadius: 6,
                backgroundColor: language === value ? colors.soft : 'transparent',
              }}
            >
              <Text
                style={{
                  color: language === value ? colors.text : colors.muted,
                  fontWeight: '600',
                }}
              >
                {value.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text style={s.muted}>{t('Check your equipment before leaving the shoot.')}</Text>
      <Failure message={query.error} retry={query.reload} />
      {!query.data && !query.error && <Loading />}
      {query.data?.active.map((session) => (
        <View key={session.id} style={s.hero}>
          <Text style={[s.label, { color: '#BFCFC2' }]}>{t('CONTINUE SHOOT')}</Text>
          <Text style={[s.heading, { color: '#FFFFFF', fontSize: 24 }]}>{session.kitName}</Text>
          <Text style={[s.text, { color: '#D6E0D8' }]}>
            {session.checked} / {session.total} {t('checked')}
          </Text>
          <Button
            title={t('Resume return check')}
            accent
            onPress={() => navigation.navigate('ReturnCheck', { sessionId: session.id })}
          />
        </View>
      ))}
      {query.data?.kits.length === 0 && (
        <Text style={s.muted}>
          {t('Create your first kit, then add each physical item with its own unique identifier.')}
        </Text>
      )}
      {query.data?.kits.map((kit) => (
        <Pressable
          key={kit.id}
          accessibilityRole="button"
          accessibilityLabel={kit.name + ', ' + t('Open kit')}
          style={({ pressed }) => [s.listItem, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => navigation.navigate('Kit', { kitId: kit.id })}
        >
          <View style={s.badge}>
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>
              {String(kit.id).padStart(2, '0')}
            </Text>
          </View>
          <View style={s.grow}>
            <Text style={s.heading}>{kit.name}</Text>
            <Text style={s.muted}>
              {kit.itemCount} {t('physical items')}
            </Text>
          </View>
          <Text style={{ fontSize: 25, color: colors.muted }}>›</Text>
        </Pressable>
      ))}
      <Button
        title={creating ? t('Cancel') : '+ ' + t('Create a kit')}
        secondary
        onPress={() => setCreating(!creating)}
      />
      {(creating || query.data?.kits.length === 0) && (
        <View style={s.card}>
          <Text style={s.heading}>{t('Create a kit')}</Text>
          <Field
            label={t('Kit name')}
            placeholder={t('Wedding Shoot')}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
          <Failure message={error} />
          <Button title={t('Create kit')} onPress={create} disabled={!name.trim()} />
        </View>
      )}
      {!creating && !!query.data?.kits.length && <Failure message={error} />}
      <Text style={s.muted}>{t('On this device. No account. No cloud.')}</Text>
    </ScrollView>
  );
}
