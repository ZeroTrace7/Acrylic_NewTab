let globalVolume = 0.5;
let ambientAudio = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SET_VOLUME') {
    globalVolume = msg.volume;
    if (ambientAudio) ambientAudio.volume = globalVolume * 0.4;
    return;
  }

  if (msg.type === 'PLAY_SOUND') {
    const audio = new Audio(chrome.runtime.getURL(msg.source));
    audio.volume = globalVolume;
    audio.play().catch(err => console.warn('Audio play failed:', err));
    return;
  }

  if (msg.type === 'PLAY_AMBIENT') {
    if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
    ambientAudio = new Audio(chrome.runtime.getURL(msg.source));
    ambientAudio.loop = msg.loop ?? true;
    ambientAudio.volume = globalVolume * 0.4;
    ambientAudio.play().catch(err => console.warn('Audio play failed:', err));
    return;
  }

  if (msg.type === 'STOP_AMBIENT') {
    if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
  }
});

