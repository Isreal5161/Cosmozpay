import { StyleSheet } from 'react-native';

export const darkPalette = {
  primary: '#3A3A3A',
  primaryDark: '#1F1F1F',
  primaryMuted: '#2E2E2E',
  accent: '#8B5CF6',
  background: '#09090B',
  surface: '#1C1C1C',
  surfaceRaised: '#242424',
  text: '#F8F7FF',
  textMuted: '#9E9E9E',
  border: '#2F2F2F',
  success: '#22C55E',
  error: '#EF4444',
  shadow: 'rgba(0, 0, 0, 0.35)',
  softIcon: '#2A2A2A',
  avatar: '#4B4B4B',
  bottomBar: '#1F1F1F',
  icon: '#F8F7FF',
  iconOnPrimary: '#FFFFFF',
  pattern: 'rgba(158,158,158,0.06)',
  patternAlt: 'rgba(158,158,158,0.04)',
};

export const lightPalette = {
  primary: '#3A3A3A',
  primaryDark: '#2A2A2A',
  primaryMuted: '#E5E5E5',
  background: '#F6F2FF',
  surface: '#FFFFFF',
  surfaceRaised: '#F3F3F3',
  text: '#1F1B33',
  textMuted: '#6B7280',
  border: '#EDEDED',
  success: '#22C55E',
  error: '#DC2626',
  shadow: 'rgba(0, 0, 0, 0.06)',
  softIcon: '#F5F5F5',
  avatar: '#D1D5DB',
  bottomBar: '#F6F2FF',
  icon: '#333333',
  iconOnPrimary: '#FFFFFF',
  accent: '#7C3AED',
  pattern: 'rgba(124,58,237,0.10)',
  patternAlt: 'rgba(99,102,241,0.08)',
};

export function getPalette(mode = 'dark') {
  return mode === 'light' ? lightPalette : darkPalette;
}

function createBottomTabStyles(palette) {
  return {
    bottomNav: {
      backgroundColor: palette.bottomBar,
      borderTopColor: palette.border,
      borderTopWidth: 1,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      left: 0,
      paddingBottom: 18,
      paddingHorizontal: 12,
      paddingTop: 14,
      position: 'absolute',
      right: 0,
    },
    bottomTab: {
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
    },
    bottomTabIcon: {
      alignItems: 'center',
      borderRadius: 14,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    bottomTabIconActive: {
      backgroundColor: 'transparent',
    },
    bottomTabLabel: {
      color: palette.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    bottomTabLabelActive: {
      color: palette.text,
      fontWeight: '700',
    },
  };
}

export const splashScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 200,
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    padding: 22,
    width: 200,
    shadowColor: 'rgba(0,0,0,0.16)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  logoImage: {
    height: 128,
    width: 128,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 320,
  },
  loaderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  loaderDot: {
    backgroundColor: '#9CA3AF',
    borderRadius: 5,
    height: 10,
    width: 10,
    opacity: 0.9,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomArea: {
    paddingBottom: 56,
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
});

export function getHomeDashboardStyles(palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 118,
    },

    stickyHeaderWrap: {
      backgroundColor: palette.background,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 6,
    },

    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    profileAvatar: {
      alignItems: 'center',
      backgroundColor: palette.surfaceRaised,
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 44,
    },

    profileAvatarText: {
      color: palette.text,
      fontSize: 18,
      fontWeight: '700',
    },

    headerTextWrap: {
      flex: 1,
      marginHorizontal: 12,
    },

    headerEyebrow: {
      color: palette.textMuted,
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 2,
    },

    headerTitle: {
      color: palette.text,
      fontSize: 18,
      fontWeight: '800',
    },

    headerActionsGroup: {
      flexDirection: 'row',
      gap: 8,
    },

    headerIconButtonPrimary: {
      alignItems: 'center',
      backgroundColor: palette.surfaceRaised,
      borderRadius: 10,
      height: 40,
      justifyContent: 'center',
      marginLeft: 4,
      width: 40,
    },

    /* =========================
       BALANCE CARD (UPDATED)
    ========================= */

    balanceCard: {
      borderRadius: 12,
      marginBottom: 24,
      backgroundColor: palette.surfaceRaised,
      overflow: 'hidden',
      position: 'relative',
    },

    balanceGradient: {
      padding: 0,
    },

    balanceInner: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 18,
      position: 'relative',
      zIndex: 1,
    },

    /* decorative pattern shapes inside the balance card */
    balancePatternTopRight: {
      position: 'absolute',
      top: -18,
      right: -18,
      width: 110,
      height: 110,
      borderRadius: 56,
      backgroundColor: palette.pattern,
      opacity: 0.22,
      transform: [{ scale: 1 }],
      zIndex: 2,
      pointerEvents: 'none',
    },

    balancePatternCurve: {
      position: 'absolute',
      top: 34,
      right: 12,
      width: 160,
      height: 64,
      borderRadius: 80,
      backgroundColor: palette.patternAlt || palette.pattern,
      opacity: 0.16,
      transform: [{ rotate: '-12deg' }],
      zIndex: 2,
      pointerEvents: 'none',
    },

    balancePatternBottomLeft: {
      position: 'absolute',
      left: -24,
      bottom: -22,
      width: 160,
      height: 80,
      borderTopLeftRadius: 80,
      borderTopRightRadius: 80,
      backgroundColor: palette.pattern,
      opacity: 0.18,
      zIndex: 2,
      pointerEvents: 'none',
    },

    totalLabel: {
      color: palette.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    balanceAmount: {
      color: palette.text,
      fontSize: 32,
      fontWeight: '900',
      marginBottom: 18,
    },

    balanceMiniRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 10,
    },

    miniBalanceBox: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: palette.surface === '#FFFFFF' ? 1 : 0,
      borderColor: palette.border,
    },

    miniBalanceLabel: {
      color: palette.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },

    miniBalanceValue: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 8,
    },

    balanceActions: {
      flexDirection: 'row',
      gap: 12,
    },

    balanceActionButtonPrimary: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: palette.text,
      borderRadius: 10,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 16,
    },

    balanceActionButtonPrimaryText: {
      color: palette.background,
      fontSize: 13,
      fontWeight: '700',
    },

    balanceActionButtonSecondary: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 10,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 16,
    },

    balanceActionButtonSecondaryText: {
      color: palette.text,
      fontSize: 13,
      fontWeight: '700',
    },

    /* =========================
       QUICK ACTIONS
    ========================= */

    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 22,
      rowGap: 12,
    },

    actionButton: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 10,
      flexDirection: 'row',
      minHeight: 64,
      paddingHorizontal: 16,
      width: '48%',
    },

    actionIconWrap: {
      alignItems: 'center',
      backgroundColor: palette.surfaceRaised,
      borderRadius: 10,
      height: 30,
      justifyContent: 'center',
      marginRight: 12,
      width: 30,
    },

    actionLabel: {
      color: palette.text,
      fontSize: 14,
      fontWeight: '600',
    },

    /* =========================
       SERVICES
    ========================= */

    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    sectionTitle: {
      color: palette.text,
      fontSize: 17,
      fontWeight: '500',
    },

    sectionLink: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '700',
    },

    servicesGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 28,
    },

    serviceTile: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 12,
      width: '23%',
      minHeight: 100,
      justifyContent: 'flex-start',
    },

    serviceIconWrap: {
      alignItems: 'center',
      borderRadius: 8,
      height: 44,
      justifyContent: 'center',
      marginBottom: 8,
      width: 44,
    },

    serviceLabel: {
      color: palette.text,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 6,
    },

    serviceCardLabel: {
      color: palette.text,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 20,
    },

    /* =========================
       TRANSACTIONS
    ========================= */

    transactionsCard: {
      backgroundColor: palette.surface,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },

    transactionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },

    transactionLeft: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },

    transactionIconWrap: {
      alignItems: 'center',
      backgroundColor: palette.primaryMuted,
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },

    transactionTitle: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 4,
    },

    transactionSubtitle: {
      color: palette.textMuted,
      fontSize: 12,
    },

    transactionAmount: {
      fontSize: 14,
      fontWeight: '700',
    },

    amountPositive: {
      color: palette.success,
    },

    amountNegative: {
      color: palette.text,
    },

    rowDivider: {
      backgroundColor: palette.border,
      height: 1,
    },

    ...createBottomTabStyles(palette),
  });
}
export function getPaymentScreenStyles(palette) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 118,
  },
  stickyHeaderWrap: {
    backgroundColor: palette.background,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  headerAction: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  balanceCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    marginBottom: 28,
    padding: 20,
  },
  balanceLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  balanceAmount: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  balanceNote: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  balanceButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButtonText: {
    color: palette.background,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionLink: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  serviceCard: {
    alignItems: 'flex-start',
    backgroundColor: palette.surface,
    borderRadius: 18,
    minHeight: 122,
    padding: 16,
    width: '48%',
  },
  serviceIconShell: {
    alignItems: 'center',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
    width: 44,
  },
  serviceCardLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  ...createBottomTabStyles(palette),
  });
}

export function getCardScreenStyles(palette) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 118,
  },
  stickyHeaderWrap: {
    backgroundColor: palette.background,
    marginHorizontal: -16,
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  headerAction: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  comingSoonCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 20,
  },
  comingSoonBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.primaryMuted,
    borderRadius: 999,
    justifyContent: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  comingSoonBadgeText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  comingSoonTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  comingSoonText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  comingSoonList: {
    gap: 10,
    marginBottom: 22,
  },
  comingSoonListItem: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  notifyButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 46,
  },
  notifyButtonText: {
    color: palette.background,
    fontSize: 14,
    fontWeight: '700',
  },
  ...createBottomTabStyles(palette),
  });
}

export function getActivityScreenStyles(palette) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 118,
  },
  stickyHeaderWrap: {
    backgroundColor: palette.background,
    marginHorizontal: -16,
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  headerAction: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  balanceCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    marginBottom: 22,
    padding: 20,
  },
  balanceLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  balanceAmount: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  balanceNote: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  listCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  activityLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12,
  },
  activityIconWrap: {
    alignItems: 'center',
    backgroundColor: palette.primaryMuted,
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  activityTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  activitySubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  activityTime: {
    color: palette.textMuted,
    fontSize: 11,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountPositive: {
    color: palette.success,
  },
  amountNegative: {
    color: palette.text,
  },
  rowDivider: {
    backgroundColor: palette.border,
    height: 1,
  },
  ...createBottomTabStyles(palette),
  });
}

export function getProfileScreenStyles(palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 118,
    },
    stickyHeaderWrap: {
      backgroundColor: palette.background,
      marginHorizontal: -16,
      paddingTop: 20,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerEyebrow: {
      color: palette.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
    },
    headerTitle: {
      color: palette.text,
      fontSize: 24,
      fontWeight: '800',
    },
    headerAction: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 18,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    profileCard: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 22,
      marginBottom: 22,
      padding: 20,
    },
    profileAvatar: {
      alignItems: 'center',
      backgroundColor: palette.primaryMuted,
      borderRadius: 36,
      height: 72,
      justifyContent: 'center',
      marginBottom: 14,
      width: 72,
    },
    profileAvatarText: {
      color: palette.primary,
      fontSize: 28,
      fontWeight: '800',
    },
    profileName: {
      color: palette.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },
    profileHandle: {
      color: palette.textMuted,
      fontSize: 13,
      marginBottom: 14,
    },
    tierBadge: {
      backgroundColor: palette.primaryMuted,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tierBadgeText: {
      color: palette.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      marginBottom: 18,
      padding: 18,
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 14,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    rowLeft: {
      alignItems: 'center',
      flexDirection: 'row',
      flex: 1,
      gap: 12,
      paddingRight: 12,
    },
    rowIconWrap: {
      alignItems: 'center',
      backgroundColor: palette.surfaceRaised,
      borderRadius: 14,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    rowTitle: {
      color: palette.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 3,
    },
    rowSubtitle: {
      color: palette.textMuted,
      fontSize: 12,
    },
    rowValue: {
      color: palette.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    divider: {
      backgroundColor: palette.border,
      height: 1,
    },
    modeCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      marginBottom: 18,
      padding: 18,
    },
    modeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modeInfo: {
      flex: 1,
      paddingRight: 16,
    },
    modeTitle: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    },
    modeText: {
      color: palette.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    agentBanner: {
      borderRadius: 14,
      padding: 16,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    agentTextWrap: {
      flex: 1,
      paddingRight: 12,
    },
    agentTitle: {
      color: palette.background,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    agentSubtitle: {
      color: palette.background,
      fontSize: 13,
      opacity: 0.95,
    },
    agentButton: {
      backgroundColor: palette.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    agentButtonText: {
      color: palette.primary,
      fontWeight: '700',
    },
    ...createBottomTabStyles(palette),
  });
}