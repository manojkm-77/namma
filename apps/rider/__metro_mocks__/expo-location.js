module.exports = {
  requestForegroundPermissionsAsync: async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
  }),
  getCurrentPositionAsync: async (options) => ({
    coords: {
      latitude: 12.2958,
      longitude: 76.6394,
      altitude: 0,
      accuracy: 5,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  }),
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
    DENIED: 'denied',
  },
};
