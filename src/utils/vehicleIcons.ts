export const getVehicleIcon = (type?: string): string => {
  switch (type) {
    case 'bike':
      return '🏍️';
    case 'car':
      return '🚗';
    case 'threewheeler':
      return '🛺';
    case 'van':
      return '🚐';
    case 'other':
    default:
      return '🚛'; // Fallback to the original generic icon
  }
};
