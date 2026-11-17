// Web: Vibration API (Android browsers only; iOS Safari ignores it).
// Native later: replace with @capacitor/haptics ImpactStyle.Light.
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptics = {
  supported: canVibrate,
  puff() {
    if (canVibrate) navigator.vibrate(12);
  },
};
