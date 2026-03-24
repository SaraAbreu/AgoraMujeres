import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface MessageAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
  onPress: () => void | Promise<void>;
  destructive?: boolean;
}

interface MessageActionsMenuProps {
  visible: boolean;
  messageContent: string;
  onDismiss: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export const MessageActionsMenu: React.FC<MessageActionsMenuProps> = ({
  visible,
  messageContent,
  onDismiss,
  onCopy,
  onDelete,
  onShare,
}) => {
  const actions: MessageAction[] = [
    {
      id: 'copy',
      label: 'Copiar',
      icon: 'copy',
      onPress: onCopy,
    },
    {
      id: 'share',
      label: 'Compartir',
      icon: 'share-2',
      onPress: onShare,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'trash-2',
      color: '#E74C3C',
      onPress: onDelete,
      destructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.container}>
          <View style={styles.menu}>
            {/* Mostrar preview del mensaje */}
            <View style={styles.preview}>
              <Text style={styles.previewText} numberOfLines={2}>
                {messageContent}
              </Text>
            </View>

            {/* Separador */}
            <View style={styles.divider} />

            {/* Acciones */}
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  action.destructive && styles.actionButtonDestructive,
                ]}
                onPress={async () => {
                  try {
                    await action.onPress();
                  } catch (error) {
                    console.error(`Error executing action ${action.id}:`, error);
                  }
                  onDismiss();
                }}
              >
                <Feather
                  name={action.icon as any}
                  size={18}
                  color={action.color || colors.text}
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    action.destructive && styles.actionLabelDestructive,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Botón Cerrar */}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
            >
              <Text style={styles.closeLabel}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  preview: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
  },
  previewText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  actionButtonDestructive: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  actionIcon: {
    marginRight: 12,
    width: 20,
  },
  actionLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  actionLabelDestructive: {
    color: '#E74C3C',
  },
  closeButton: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
});
