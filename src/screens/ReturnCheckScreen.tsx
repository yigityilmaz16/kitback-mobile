import { t } from '../i18n';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRepository } from '../data/context';
import { Button, Failure, Field, Loading, message } from '../ui/components';
import { styles as s, colors } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import { Scanner } from '../scanner/Scanner';
import { ScanGate } from '../scanner/scanGate';
import type { ScanResult } from '../data/repository';
import type { ScreenProps } from '../navigation';
function feedback(result: ScanResult): string {
  switch (result.kind) {
    case 'checked':
      return t('Checked \u00B7 ') + result.name;
    case 'duplicate':
      return t('Already checked \u00B7 ') + result.name;
    case 'foreign':
      return t('Not part of this shoot\u2019s expected equipment.');
    case 'unknown':
      return t('Unknown identifier. No equipment was checked.');
    case 'invalid':
      return t('Invalid identifier. Try another label.');
    case 'closed':
      return t('This shoot is no longer active.');
  }
}
export function ReturnCheckScreen({ navigation, route }: ScreenProps<'ReturnCheck'>) {
  const { sessionId } = route.params;
  const repo = useRepository();
  const gate = useRef(new ScanGate());
  const [notice, setNotice] = useState(t('Point at an equipment label.'));
  const [tone, setTone] = useState<'good' | 'warn'>('good');
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useLiveQuery(() => repo.session(sessionId));
  function scan(raw: string, fromCamera = true) {
    if (fromCamera && !gate.current.accept(raw)) return;
    setLastScanned(raw);
    try {
      const result = repo.scan(sessionId, raw);
      setNotice(feedback(result));
      setTone(result.kind === 'checked' ? 'good' : 'warn');
      setError(null);
      query.reload();
      if (result.kind === 'checked')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() =>
          setError(t('Checked and saved. Vibration is unavailable on this device.')),
        );
    } catch (e) {
      setError(t('Check was not confirmed. ') + message(e));
    }
  }
  const session = query.data;
  const all = session && session.total > 0 && session.checked === session.total;
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.label}>{t('BEFORE YOU LEAVE')}</Text>
      <Text style={s.heading}>{session?.kitName ?? t('Return check')}</Text>
      <Failure message={query.error} retry={query.reload} />
      {!session && !query.error && <Loading />}
      {session && (
        <>
          <View style={s.row}>
            <Text style={s.count}>
              {session.checked} / {session.total}
            </Text>
            <Text style={s.text}>{t('checked')}</Text>
          </View>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: colors.line }}>
            <View
              style={{
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.green,
                width: ((session.total ? (session.checked / session.total) * 100 : 0) +
                  '%') as DimensionValue,
              }}
            />
          </View>
          {all ? (
            <View style={s.card}>
              <Text style={s.title}>{t('Everything is checked.')}</Text>
              <Text style={s.muted}>
                {t('You checked every expected item. Make sure they are with you before leaving.')}
              </Text>
              <Button
                title={t('Review & complete shoot')}
                onPress={() => navigation.replace('Session', { sessionId })}
              />
            </View>
          ) : (
            session.status === 'active' && <Scanner onScan={scan} />
          )}
          <View
            style={[s.card, { borderColor: tone === 'good' ? colors.green : colors.amber }]}
            accessibilityLiveRegion="polite"
          >
            <Text style={[s.text, { color: tone === 'good' ? colors.green : colors.amber }]}>
              {notice}
            </Text>
            {lastScanned !== null && (
              <Text style={s.muted} numberOfLines={2}>
                {t('Last code read:')} {lastScanned}
              </Text>
            )}
          </View>
          <Failure message={error} />
          <Button
            title={t('View not checked \u00B7 ') + (session.total - session.checked)}
            secondary
            onPress={() => navigation.navigate('Session', { sessionId })}
          />
          {session.status === 'active' && !all && (
            <>
              <Button
                title={manual ? t('Hide manual entry') : t('Can\u2019t scan? Enter identifier')}
                secondary
                onPress={() => setManual((x) => !x)}
              />
              {manual && (
                <View style={s.card}>
                  <Field
                    label={t('Exact equipment identifier')}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={512}
                  />
                  <Button
                    title={t('Check identifier')}
                    disabled={!code.trim()}
                    onPress={() => {
                      scan(code, false);
                      setCode('');
                    }}
                  />
                </View>
              )}
            </>
          )}
          <Text style={s.muted}>{t('Checks are saved immediately on this device.')}</Text>
        </>
      )}
    </ScrollView>
  );
}
