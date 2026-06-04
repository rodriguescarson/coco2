// Small, reusable medical disclaimer footer for educational/wellness content
// (Articles, Tools). Apple Guideline 1.4.1 — remind users to seek a doctor's
// advice in addition to using the app.

import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';
import { Card } from './ui/Card';
import { useTheme, spacing } from '../lib/theme';
import { MEDICAL_DISCLAIMER } from '../lib/legal';

export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <Card tone="muted" style={{ marginTop: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textDim} style={{ marginTop: 1 }} />
        <Text variant={compact ? 'micro' : 'caption'} tone="dim" style={{ flex: 1, marginLeft: 8, lineHeight: compact ? 16 : 18 }}>
          {MEDICAL_DISCLAIMER}
        </Text>
      </View>
    </Card>
  );
}
