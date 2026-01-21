export function logEvent(type, payload) {
  fetch("/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      payload,
      timestamp: Date.now()
    })
  }).catch(() => {});
}
