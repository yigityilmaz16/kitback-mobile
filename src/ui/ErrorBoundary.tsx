import { t } from '../i18n';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './components';
import { styles as s } from './theme';
export class ErrorBoundary extends Component<
  {
    children: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('KitBack rendering failed', error.message, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <View style={[s.page, s.content, { justifyContent: 'center' }]}>
          <Text style={s.title}>{t('Let\u2019s reopen KitBack.')}</Text>
          <Text style={s.muted}>{t('Your saved checks remain on this device.')}</Text>
          <Button title={t('Return to kits')} onPress={() => this.setState({ failed: false })} />
        </View>
      );
    return this.props.children;
  }
}
