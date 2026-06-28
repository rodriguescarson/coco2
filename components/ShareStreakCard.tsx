import { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';

/**
 * A gentle, opt-in image a user can choose to share to celebrate their
 * check-in streak. Deliberately privacy-safe: it shows ONLY the streak count
 * and an encouraging line — never mood scores, journal content, or any
 * clinical/crisis data.
 *
 * Brand colours are hard-coded (not theme-derived) so the exported image looks
 * the same calm Coco card regardless of the sharer's light/dark setting.
 */

// Coco brand palette (matches the light theme in lib/theme.ts).
const BRAND = {
  green: '#0E8A5F',
  greenDeep: '#0A6B4A',
  cream: '#F8F5EE',
  ink: '#0E1A14',
  inkDim: 'rgba(255,255,255,0.82)',
  inkFaint: 'rgba(255,255,255,0.62)',
  soft: 'rgba(255,255,255,0.16)',
} as const;

export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 400;

function encouragement(streak: number): string {
  if (streak <= 1) return 'Showing up for yourself. That counts.';
  if (streak < 4) return 'A few gentle days in a row. Keep being kind to you.';
  if (streak < 8) return 'A week of checking in. Quiet, steady care.';
  if (streak < 21) return 'You keep coming back for yourself. That matters.';
  return 'A long, gentle streak of self-care. Beautifully done.';
}

type Props = {
  streak: number;
  name?: string;
};

export const ShareStreakCard = forwardRef<View, Props>(function ShareStreakCard(
  { streak, name },
  ref,
) {
  const dayWord = streak === 1 ? 'day' : 'days';
  return (
    <View ref={ref} collapsable={false} style={styles.canvas}>
      <LinearGradient
        colors={[BRAND.green, BRAND.greenDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Brand row */}
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={18} color={BRAND.green} />
          </View>
          <Text style={styles.wordmark}>Coco</Text>
        </View>

        {/* Streak */}
        <View style={styles.center}>
          <Text style={styles.kicker}>
            {name ? `${name.trim()}'s check-in streak` : 'Check-in streak'}
          </Text>
          <Text style={styles.count}>{streak}</Text>
          <Text style={styles.dayLabel}>{dayWord} of showing up</Text>
        </View>

        {/* Encouraging line */}
        <Text style={styles.encourage}>{encouragement(streak)}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>coco.carsonrodrigues.com</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: BRAND.cream,
  },
  card: {
    flex: 1,
    padding: 28,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  center: {
    alignItems: 'center',
  },
  kicker: {
    color: BRAND.inkFaint,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  count: {
    color: '#FFFFFF',
    fontSize: 96,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 104,
    marginTop: 4,
  },
  dayLabel: {
    color: BRAND.inkDim,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  encourage: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 25,
    textAlign: 'center',
    opacity: 0.95,
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BRAND.soft,
    paddingTop: 16,
  },
  footerText: {
    color: BRAND.inkFaint,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
