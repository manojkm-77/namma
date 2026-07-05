import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
  icon?: string;
  rightIcon?: string;
  onRightPress?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ placeholder, value, onChangeText, onFocus, onClear, icon, rightIcon, onRightPress, autoFocus }: SearchBarProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: br.md,
      paddingHorizontal: spacing.lg,
      height: 52,
      borderWidth: 1,
      borderColor: colors.outline,
    }}>
      {icon && <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{icon}</Text>}
      <TextInput
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.onSurface,
          fontWeight: '500',
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        autoFocus={autoFocus}
        selectionColor={colors.primary}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: spacing.xs }}>
          <Text style={{ fontSize: 18 }}>{rightIcon}</Text>
        </TouchableOpacity>
      )}
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={{ padding: spacing.xs }}>
          <Text style={{ fontSize: 16, color: colors.onSurfaceVariant }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
