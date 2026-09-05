import { t } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRepository } from '../data/context';
import { persistPhoto, discardDraftPhoto } from '../data/photos';
import { Button, Failure, Field, GearPhoto, message } from '../ui/components';
import { styles as s } from '../ui/theme';
import { Scanner } from '../scanner/Scanner';
import type { ScreenProps } from '../navigation';
export function EquipmentScreen({ navigation, route }: ScreenProps<'Equipment'>) {
  const repo = useRepository();
  const { kitId, equipmentId } = route.params;
  const existing = equipmentId ? repo.item(equipmentId) : null;
  const [name, setName] = useState(existing?.name ?? '');
  const [barcode, setBarcode] = useState(existing?.barcode ?? '');
  const [photo, setPhoto] = useState<string | null>(existing?.photo ?? null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const accepted = useRef(false);
  const saving = useRef(false);
  const drafts = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const pending = drafts.current;
    return () => {
      mounted.current = false;
      for (const file of pending) {
        try {
          discardDraftPhoto(file);
        } catch (e) {
          console.error('Draft photo cleanup failed', e);
        }
      }
    };
  }, []);
  async function choosePhoto() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && mounted.current) {
        const saved = persistPhoto(result.assets[0].uri);
        drafts.current.add(saved);
        if (photo && photo !== existing?.photo) discardDraftPhoto(photo);
        setPhoto(saved);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (saving.current) return;
    saving.current = true;
    try {
      repo.saveEquipment({ id: equipmentId, kitId, name, barcode, photo });
      if (photo) drafts.current.delete(photo);
      navigation.goBack();
    } catch (e) {
      saving.current = false;
      setError(message(e));
    }
  }
  function remove() {
    Alert.alert(
      t('Remove this equipment?'),
      t(
        'It will be removed from this kit. Existing shoot snapshots, photos and checks stay unchanged. Its identifier remains reserved to avoid confusing physical items.',
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Remove'),
          style: 'destructive',
          onPress: () => {
            try {
              if (equipmentId) repo.deleteEquipment(equipmentId);
              navigation.goBack();
            } catch (e) {
              setError(message(e));
            }
          },
        },
      ],
    );
  }
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.label}>{t('ONE LABEL \u00B7 ONE PHYSICAL ITEM')}</Text>
      <Text style={s.title}>{equipmentId ? t('Edit equipment') : t('Add equipment')}</Text>
      <Field
        label={t('Equipment name')}
        placeholder={t('Sony Battery #2')}
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      <View style={s.card}>
        <GearPhoto photo={photo} />
        <Button
          title={busy ? t('Saving photo\u2026') : t('Choose photo (optional)')}
          secondary
          disabled={busy}
          onPress={() => void choosePhoto()}
        />
      </View>
      <Field
        label={t('Unique QR / barcode value')}
        placeholder="KB-BATTERY-02"
        value={barcode}
        onChangeText={setBarcode}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={512}
      />
      <Button
        title={t('Scan identifier')}
        secondary
        onPress={() => {
          accepted.current = false;
          setScanning(true);
        }}
      />
      <Text style={s.muted}>
        {t(
          'Use a unique physical label. Retail barcodes may be identical on two batteries; those cannot identify two separate items.',
        )}
      </Text>
      {equipmentId && (
        <Text style={s.muted}>
          {t(
            'Edits affect future shoots only. An active shoot still expects the original label and photo.',
          )}
        </Text>
      )}
      <Failure message={error} />
      <Button
        title={t('Save equipment')}
        disabled={busy || !name.trim() || !barcode.trim()}
        onPress={save}
      />
      {equipmentId && <Button title={t('Remove equipment')} secondary onPress={remove} />}
      <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
        <SafeAreaView style={s.page}>
          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.title}>{t('Scan a unique label')}</Text>
            {scanning && (
              <Scanner
                onScan={(data) => {
                  if (accepted.current) return;
                  accepted.current = true;
                  setBarcode(data);
                  setScanning(false);
                }}
              />
            )}
            <Button title={t('Cancel')} secondary onPress={() => setScanning(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}
