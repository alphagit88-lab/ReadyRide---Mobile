import {Platform} from 'react-native';

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
};

export const shadowPresets = {
  card:
    Platform.select({
      ios: {
        shadowColor: '#12221A',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }) ?? {},
  soft:
    Platform.select({
      ios: {
        shadowColor: '#12221A',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }) ?? {},
};
