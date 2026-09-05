import { t, formatDate } from '../i18n';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { useRepository } from '../data/context';
import { Button, Failure, GearPhoto, Loading, message } from '../ui/components';
import { styles as s } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import type { ScreenProps } from '../navigation';
export function SessionScreen({ navigation, route }: ScreenProps<'Session'>) {
  const { sessionId } = route.params;
  const repo = useRepository();
  const [error, setError] = useState<string | null>(null);
  const query = useLiveQuery(() => ({
    session: repo.session(sessionId),
    items: repo.snapshot(sessionId),
  }));
  function finish() {
    try {
      repo.finishSession(sessionId);
      query.reload();
    } catch (e) {
      setError(message(e));
    }
  }
  function undo(id: number) {
    Alert.alert(t('Mark as not checked?'), t('You will need to check this item again.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Undo check'),
        onPress: () => {
          try {
            repo.uncheck(sessionId, id);
            query.reload();
          } catch (e) {
            setError(message(e));
          }
        },
      },
    ]);
  }
  const session = query.data?.session;
  const missing = query.data?.items.filter((x) => !x.checkedAt) ?? [];
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Failure message={query.error} retry={query.reload} />
      {!query.data && !query.error && <Loading />}
      {session && (
        <>
          <Text style={s.label}>
            {session.status === 'completed' ? t('SHOOT COMPLETED') : t('SHOOT IN PROGRESS')}
          </Text>
          <Text style={s.title}>{session.kitName}</Text>
          <Text style={s.count}>
            {session.checked} / {session.total}
          </Text>
          <Text style={s.text}>{t('checked')}</Text>
          {missing.length === 0 ? (
            <View style={s.card}>
              <Text style={s.heading}>{t('Everything is checked.')}</Text>
              <Text style={s.muted}>
                {t('A scan confirms your check, not that the item is physically packed.')}
              </Text>
              {session.status === 'active' && (
                <Button title={t('Complete shoot')} onPress={finish} />
              )}
            </View>
          ) : (
            <>
              <Text style={s.heading}>
                {t('Not checked yet \u00B7')} {missing.length}
              </Text>
              <Text style={s.muted}>{t('Find these items before leaving the shoot.')}</Text>
              {missing.map((item) => (
                <View key={item.id} style={[s.card, s.row]}>
                  <GearPhoto photo={item.photo} />
                  <Text style={[s.heading, s.grow]}>{item.name}</Text>
                </View>
              ))}
              {session.status === 'active' && (
                <Button
                  title={t('Return check \u00B7 scan gear')}
                  onPress={() => navigation.navigate('ReturnCheck', { sessionId })}
                />
              )}
            </>
          )}
          <Failure message={error} />
          <Text style={s.heading}>{t('Checked equipment')}</Text>
          {query.data?.items
            .filter((x) => x.checkedAt)
            .map((item) => (
              <View key={item.id} style={s.card}>
                <View style={s.row}>
                  <GearPhoto photo={item.photo} />
                  <View style={s.grow}>
                    <Text style={s.text}>{item.name}</Text>
                    <Text style={s.label}>{t('CHECKED')}</Text>
                  </View>
                </View>
                {session.status === 'active' && (
                  <Button title={t('Undo check')} secondary onPress={() => undo(item.id)} />
                )}
              </View>
            ))}
          <Text style={s.muted}>
            {t('Expected list captured')} {formatDate(session.startedAt)}
          </Text>
        </>
      )}
    </ScrollView>
  );
}
