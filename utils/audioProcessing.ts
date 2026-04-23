/**
 * Audio Processing Utilities
 * Handles in-browser conversion and trimming using Web Audio API
 */

// Helper to write string to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper to encode AudioBuffer to WAV (24-bit, 48kHz)
const bufferToWav24 = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels; 
  const sampleRate = 48000; // Force 48kHz
  const format = 1; // PCM
  const bitDepth = 24;
  
  const resultLength = buffer.length * numChannels * (bitDepth / 8);
  const headerLength = 44;
  const totalLength = headerLength + resultLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + resultLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, resultLength, true);
  
  // Interleave and write 24-bit samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      
      // Clamp sample to -1 to 1
      sample = Math.max(-1, Math.min(1, sample));
      
      // Scale to 24-bit integer range
      let val = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
      val = Math.round(val);
      
      // Write 3 bytes (Little Endian)
      view.setUint8(offset, val & 0xFF);
      view.setUint8(offset + 1, (val >> 8) & 0xFF);
      view.setUint8(offset + 2, (val >> 16) & 0xFF);
      
      offset += 3;
    }
  }
  
  return new Blob([view], { type: 'audio/wav' });
};

export const getAudioDuration = async (file: File): Promise<number> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
}

export const processFullAudio = async (file: File, targetFileName: string, onProgress?: (p: number) => void): Promise<File> => {
  try {
    if (onProgress) onProgress(1);
    const arrayBuffer = await file.arrayBuffer();
    if (onProgress) onProgress(10);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000
    });
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    if (onProgress) onProgress(30);
    
    // Process to offline context to resample/render to 48kHz and ensure stereo
    const offlineCtx = new OfflineAudioContext(
        2,
        Math.ceil(audioBuffer.duration * 48000),
        48000
    );
    if (onProgress) onProgress(40);
    
    // Ensure stereo: if mono, duplicate channel
    let bufferToUse = audioBuffer;
    if (audioBuffer.numberOfChannels === 1) {
      const stereoBuffer = offlineCtx.createBuffer(2, Math.ceil(audioBuffer.duration * 48000), 48000);
      const monoData = audioBuffer.getChannelData(0);
      for (let ch = 0; ch < 2; ch++) {
        stereoBuffer.getChannelData(ch).set(monoData);
      }
      bufferToUse = stereoBuffer;
    }
    if (onProgress) onProgress(50);

    const source = offlineCtx.createBufferSource();
    source.buffer = bufferToUse;
    source.connect(offlineCtx.destination);
    source.start();
    
    let prog = 55;
    let done = false;
    const timer = setInterval(() => {
      if (done) return;
      prog = Math.min(95, prog + 1);
      if (onProgress) onProgress(prog);
    }, 100);
    const renderedBuffer = await offlineCtx.startRendering();
    done = true;
    clearInterval(timer);
    if (onProgress) onProgress(98);
    const wavBlob = bufferToWav24(renderedBuffer);
    
    // Rename file
    const safeName = targetFileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const newName = `${safeName}.wav`;
    
    if (onProgress) onProgress(100);
    return new File([wavBlob], newName, { type: 'audio/wav' });
  } catch (error) {
    console.error("Audio conversion failed", error);
    throw new Error("Failed to convert audio to WAV.");
  }
};

export const cropAndConvertAudio = async (
    file: File, 
    startTime: number, 
    duration: number, 
    targetFileName: string,
    onProgress?: (p: number) => void
): Promise<File> => {

  try {
    if (onProgress) onProgress(1);
    const arrayBuffer = await file.arrayBuffer();
    if (onProgress) onProgress(10);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000
    });
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    if (onProgress) onProgress(30);
    
    // Calculate start and length in samples
    const startSample = Math.floor(startTime * 48000);
    const lengthSamples = Math.floor(duration * 48000);
    
    // Ensure we don't go out of bounds
    const finalLength = Math.min(lengthSamples, audioBuffer.length - startSample);

    const offlineCtx = new OfflineAudioContext(
        2,
        finalLength,
        48000
    );
    if (onProgress) onProgress(40);
    
    // Prepare buffer segment and ensure stereo
    let segmentBuffer = audioBuffer;
    if (audioBuffer.numberOfChannels === 1) {
      const stereoBuffer = offlineCtx.createBuffer(2, audioBuffer.length, 48000);
      const monoData = audioBuffer.getChannelData(0);
      for (let ch = 0; ch < 2; ch++) {
        stereoBuffer.getChannelData(ch).set(monoData);
      }
      segmentBuffer = stereoBuffer;
    }
    if (onProgress) onProgress(50);

    const source = offlineCtx.createBufferSource();
    source.buffer = segmentBuffer;
    source.connect(offlineCtx.destination);
    
    // Start playback at 'startTime' relative to the original buffer, 
    // but scheduled at time 0 in the offline context.
    // However, createBufferSource doesn't support "offset" in the buffer property directly like that easily for rendering only a part efficiently without playing.
    // Better approach: Copy the specific part of the buffer to a new buffer node
    
    source.start(0, startTime, duration); // play at 0, offset startTime, for duration
    
    let prog = 55;
    let done = false;
    const timer = setInterval(() => {
      if (done) return;
      prog = Math.min(95, prog + 1);
      if (onProgress) onProgress(prog);
    }, 100);
    const renderedBuffer = await offlineCtx.startRendering();
    done = true;
    clearInterval(timer);
    if (onProgress) onProgress(98);
    
    const wavBlob = bufferToWav24(renderedBuffer);
    
    // Rename file
    const safeName = targetFileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const newName = `${safeName}-trim.wav`;
    
    if (onProgress) onProgress(100);
    return new File([wavBlob], newName, { type: 'audio/wav' });
    
  } catch (error) {
    console.error("Audio trimming failed", error);
    throw new Error("Failed to process audio clip.");
  }
};
