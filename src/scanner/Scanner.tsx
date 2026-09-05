import { useEffect, useState } from 'react';
import { AppState, Linking, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Button, Failure, Loading, message } from '../ui/components';
import { styles as s, colors } from '../ui/theme';
export function Scanner({ onScan }: { onScan: (data: string) => void }) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [torch, setTorch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      if (state === 'active') void getPermission().catch((e) => setError(message(e)));
    });
    return () => sub.remove();
  }, [getPermission]);
  async function grant() {
    try {
      await requestPermission();
      setError(null);
    } catch (e) {
      setError(message(e));
    }
  }
  async function settings() {
    try {
      await Linking.openSettings();
    } catch (e) {
      setError(message(e));
    }
  }
  if (!permission) return <Loading />;
  if (!permission.granted)
    return (
      <View style={s.card}>
        <Text style={s.heading}>Camera access needed</Text>
        <Text style={s.muted}>
          Allow the camera to scan equipment labels. Your images stay on this device. You can also
          enter an identifier manually.
        </Text>
        <Failure message={error} />
        <Button
          title={permission.canAskAgain ? 'Allow camera' : 'Open Android settings'}
          onPress={() => void (permission.canAskAgain ? grant() : settings())}
        />
      </View>
    );
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          height: 280,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: '#030705',
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        {focused && foreground && !error && (
          <CameraView
            key={generation}
            style={{ flex: 1 }}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'code128',
                'code39',
                'code93',
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'pdf417',
                'datamatrix',
                'itf14',
                'aztec',
                'codabar',
              ],
            }}
            onBarcodeScanned={(result) => onScan(result.data)}
            onMountError={(e) => setError(e.message || 'Camera could not start.')}
          />
        )}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 55,
            left: 35,
            right: 35,
            bottom: 55,
            borderWidth: 2,
            borderColor: colors.green,
            borderRadius: 16,
          }}
        />
      </View>
      <Failure
        message={error}
        retry={() => {
          setError(null);
          setGeneration((x) => x + 1);
        }}
      />
      <Button
        secondary
        title="Restart camera"
        onPress={() => {
          setError(null);
          setGeneration((x) => x + 1);
        }}
      />
      <Button
        secondary
        title={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
        onPress={() => setTorch((x) => !x)}
      />
    </View>
  );
}
