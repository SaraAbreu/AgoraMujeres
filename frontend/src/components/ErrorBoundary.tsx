import { ReactNode, Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPO } from '../theme';

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
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <Text style={styles.icon}>⚠️</Text>

        {/* Error Title */}
        <Text style={styles.title}>
          Algo inesperado ocurrió
        </Text>

        {/* Error Description */}
        <Text style={styles.description}>
          No es tu culpa. Estamos aquí para ayudarte.
        </Text>

        {/* Error Details (only in development) */}
        {__DEV__ && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorTitle}>
              Detalles del error
            </Text>
            <Text style={styles.errorText}>
              {error.message}
            </Text>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={onReset}
        >
          <Text style={styles.resetButtonText}>
            Reintentar
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
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 450,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPO.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPO.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  errorDetails: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.danger + '08',
  },
  errorTitle: {
    ...TYPO.caption,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  errorText: {
    ...TYPO.bodySmall,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  helpSection: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  helpTitle: {
    ...TYPO.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  helpItem: {
    ...TYPO.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    ...TYPO.h3,
    color: COLORS.white,
  },
});
