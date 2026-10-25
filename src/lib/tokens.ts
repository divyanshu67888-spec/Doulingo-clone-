export const TOKENS = {
  colors: {
    brand: {
      green: '#58CC02',
      greenDark: '#46A302',
      greenLight: '#E5F8D0',
      greenBorder: '#58A700',
    },
    semantic: {
      streak: '#FF9600',
      streakDark: '#CC7800',
      streakLight: '#FFF4E5',
      xp: '#FFC800',
      xpDark: '#CCA000',
      xpLight: '#FFF9E5',
      hearts: '#FF4B4B',
      heartsDark: '#D43232',
      heartsLight: '#FFEBEB',
      lessons: '#1CB0F6',
      lessonsDark: '#1899D6',
      lessonsLight: '#E8F7FE',
      crownGold: '#FFD700',
      crownDark: '#C9A800',
    },
    leagues: {
      bronze: '#CD7F32',
      bronzeDark: '#A0522D',
      silver: '#A8A8A8',
      silverDark: '#787878',
      gold: '#FFD700',
      goldDark: '#CCA000',
      sapphire: '#0F52BA',
      sapphireDark: '#083377',
      ruby: '#E0115F',
      rubyDark: '#990038',
    },
    gray: {
      50: '#F7F7F7',
      100: '#E5E5E5',
      200: '#CECECE',
      300: '#AFAFAF',
      400: '#777777',
      500: '#4B4B4B',
      600: '#373737',
      700: '#262626',
      800: '#181818',
      900: '#111111',
    },
    white: '#FFFFFF',
    black: '#000000',
    cardBorder: '#E5E5E5',
    cardBorderDark: '#2D2D2D',
  },
  radii: {
    pill: '9999px',
    card: '16px',
    cardSm: '12px',
    modal: '20px',
  },
  shadows: {
    buttonPrimary: '0 4px 0 #46A302',
    buttonPrimaryActive: '0 0 0 #46A302',
    buttonSecondary: '0 4px 0 #CECECE',
    buttonDanger: '0 4px 0 #D43232',
    buttonOutline: '0 2px 0 #E5E5E5',
    card: '0 4px 0 #E5E5E5',
    cardHover: '0 6px 0 #E5E5E5',
    glowGreen: '0 0 16px rgba(88, 204, 2, 0.45)',
  },
  spacing: {
    minTouchTarget: '48px',
  },
  iconSizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 36,
  },
  animation: {
    transitionFast: '150ms ease',
    transitionNormal: '250ms ease',
    transitionSlow: '350ms ease',
  },
} as const;

export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Ruby';

export const LEAGUE_THRESHOLDS: Record<LeagueTier, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Sapphire: 3500,
  Ruby: 7000,
};

export const LEAGUE_ORDER: LeagueTier[] = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby'];
