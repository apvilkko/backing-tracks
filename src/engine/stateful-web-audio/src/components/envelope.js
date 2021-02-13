export const triggerEnvelope = ({
  context,
  param,
  attack = 0.002,
  release = 2.0,
  sustain = 1,
  delta
}) => {
  const now = context.currentTime + delta
  param.cancelScheduledValues(now)
  param.setValueAtTime(0, now)
  param.linearRampToValueAtTime(sustain, now + attack)
  param.linearRampToValueAtTime(0, now + attack + release)
}
