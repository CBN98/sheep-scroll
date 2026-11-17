// Web: Screen Wake Lock API (needs HTTPS). Native later: @capacitor-community/keep-awake.
let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function acquire() {
  if (!wanted || sentinel || !('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    // denied, or page hidden — try again on next visibility change
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') acquire();
  });
}

export const keepAwake = {
  on() {
    wanted = true;
    acquire();
  },
  off() {
    wanted = false;
    sentinel?.release();
    sentinel = null;
  },
};
