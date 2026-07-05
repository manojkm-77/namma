import React from 'react';
import { View } from 'react-native';

const MockMapView = React.forwardRef((props, ref) => {
  return (
    <View
      ref={ref}
      style={[{ flex: 1, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }, props.style]}
    >
      {props.children}
    </View>
  );
});

MockMapView.displayName = 'MapView';

export const MapView = MockMapView;
export const Camera = function() { return null; };
export const PointAnnotation = function() { return null; };
export const MarkerView = function() { return null; };
export const UserLocation = function() { return null; };
export default { MapView, Camera, PointAnnotation, MarkerView, UserLocation };
