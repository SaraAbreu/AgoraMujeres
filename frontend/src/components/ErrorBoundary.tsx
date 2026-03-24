import { ReactNode, Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: any;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // In production, you could send this to an error tracking service
    // like Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): any {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#1A1A1A' : '#F5F3F0',
    text: isDark ? '#E8E8E8' : '#3D3D3D',
    lightText: isDark ? '#A8A8A8' : '#8B8B8B',
    errorRed: '#FF6B6B',
    mossGreen: isDark ? '#6B8476' : '#7A9B82',
    cream: isDark ? '#2A2A2A' : '#FDFBF9',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.content, { backgroundColor: themeColors.cream }]}>
        {/* Icon */}
        <Text style={styles.icon}>⚠️</Text>

        {/* Error Title */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          Oops, algo salió mal
        </Text>

        {/* Error Description */}
        <Text style={[styles.description, { color: themeColors.lightText }]}>
          Encontramos un problema. No es tu culpa. Vamos a arreglarlo.
        </Text>

        {/* Error Details (only in development) */}
        {__DEV__ && error && (
          <View style={[styles.errorDetails, { borderColor: themeColors.errorRed }]}>
            <Text style={[styles.errorTitle, { color: themeColors.errorRed }]}>
              Detalles del error (desarrollo):
            </Text>
            <Text style={[styles.errorText, { color: themeColors.lightText }]}>
              {error.message}
            </Text>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={[styles.helpTitle, { color: themeColors.text }]}>
            ¿Qué puedes hacer?
          </Text>
          <Text style={[styles.helpItem, { color: themeColors.lightText }]}>
            • Recarga la app
          </Text>
          <Text style={[styles.helpItem, { color: themeColors.lightText }]}>
            • Comprueba tu conexión
          </Text>
          <Text style={[styles.helpItem, { color: themeColors.lightText }]}>
            • Si el problema persiste, contacta con soporte
          </Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: themeColors.mossGreen }]}
          onPress={onReset}
        >
          <Text style={[styles.resetButtonText, { color: themeColors.cream }]}>
            Reintentar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { borderColor: themeColors.mossGreen }]}
          onPress={() => {
            // Would navigate home, but this is a fallback
            onReset();
          }}
        >
          <Text style={[styles.homeButtonText, { color: themeColors.mossGreen }]}>
            Ir al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  errorTitle: {
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  helpSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0DCD8',
  },
  helpTitle: {
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 16,
  },
  helpItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  homeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
