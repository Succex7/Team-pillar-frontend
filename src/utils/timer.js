// countdown timer that survives tab switches and system sleep
// It uses Date.now() so it survives tab blur/focus
export function createTimer(durationSeconds, onTick, onExpire) {
  const endTime = Date.now() + durationSeconds * 1000;
  let interval;

  function tick() {
    const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    onTick(remaining);
    if (remaining <= 0) {
      clearInterval(interval);
      onExpire();
    }
  }

  return {
    start() {
      interval = setInterval(tick, 1000);
      tick();
    },
    stop() {
      clearInterval(interval);
    },
  };
}