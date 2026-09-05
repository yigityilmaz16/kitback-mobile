import { t, formatDate } from '../i18n';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { useRepository } from '../data/context';
import { Button, Failure, GearPhoto, Loading, message } from '../ui/components';
import { styles as s } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import type { ScreenProps } from '../navigation';
export function KitScreen({ navigation, route }: ScreenProps<'Kit'>) {
  const { kitId } = route.params;
  const repo = useRepository();
  const [error, setError] = useState<string | null>(null);
  const query = useLiveQuery(() => ({
    kit: repo.kits().find((k) => k.id === kitId),
    items: repo.equipment(kitId),
    sessions: repo.sessions(kitId),
  }));
  function start() {
    try {
      const id = repo.startSession(kitId);
      navigation.navigate('Session', { sessionId: id });
    } catch (e) {
      setError(message(e));
    }
  }
  const active = query.data?.sessions.find((x) => x.status === 'active');
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Failure message={query.error} retry={query.reload} />
      {!query.data && !query.error && <Loading />}
      <Text style={s.title}>{query.data?.kit?.name ?? t('Your kit')}</Text>
      <Text style={s.muted}>
        {t(
          'Each item is a physical piece of gear. Two identical batteries need two unique labels.',
        )}
      </Text>
      <Button
        title={t('Add equipment')}
        secondary
        onPress={() => navigation.navigate('Equipment', { kitId })}
      />
      {query.data?.items.map((item) => (
        <Pressable
          key={item.id}
          style={s.listItem}
          accessibilityRole="button"
          accessibilityLabel={item.name + ', ' + t('Edit equipment')}
          onPress={() => navigation.navigate('Equipment', { kitId, equipmentId: item.id })}
        >
          <GearPhoto photo={item.photo} />
          <View style={s.grow}>
            <Text style={s.heading}>{item.name}</Text>
            <Text style={s.muted}>{item.barcode}</Text>
          </View>
          <Text style={s.muted}>›</Text>
        </Pressable>
      ))}
      {query.data?.items.length === 0 && (
        <Text style={s.muted}>
          {t('No equipment yet. Add the items you will take to your shoot.')}
        </Text>
      )}
      <Failure message={error} />
      <Button
        title={active ? t('Continue active shoot') : t('Start shoot')}
        disabled={!active && !query.data?.items.length}
        onPress={start}
      />
      <Text style={s.muted}>
        {t(
          'Starting a shoot freezes the expected list. Later kit changes apply only to new shoots.',
        )}
      </Text>
      <Text style={s.heading}>{t('Shoot history')}</Text>
      {query.data?.sessions.map((session) => (
        <View key={session.id} style={s.card}>
          <Text style={s.label}>{session.status === 'active' ? t('ACTIVE') : t('COMPLETED')}</Text>
          <Text style={s.text}>{formatDate(session.startedAt)}</Text>
          <Text style={s.muted}>
            {session.checked} / {session.total} {t('checked')}
          </Text>
          <Button
            title={t('View shoot')}
            secondary
            onPress={() => navigation.navigate('Session', { sessionId: session.id })}
          />
        </View>
      ))}
    </ScrollView>
  );
}
