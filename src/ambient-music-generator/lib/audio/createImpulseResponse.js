export function createImpulseResponse(
  context,
  seconds = 8,
  decay = 4.5,
  seed = 0
) {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  const buffer = context.createBuffer(2, length, sampleRate);

  const hash32 = (x) => {
    let t = x | 0;
    t = Math.imul(t ^ (t >>> 16), 0x7feb352d);
    t = Math.imul(t ^ (t >>> 15), 0x846ca68b);
    return (t ^ (t >>> 16)) >>> 0;
  };

  const hashToUnitFloat = (x) => hash32(x) / 4294967296;

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.pow(1 - t, decay);
      const n =
        hashToUnitFloat(seed ^ Math.imul(channel + 1, 0x9e3779b9) ^ i) * 2 - 1;
      data[i] = n * env;
    }
  }
  return buffer;
}
