const HOST_SOURCE = 'acrylic-youtube-wallpaper-host';
const BRIDGE_SOURCE = 'acrylic-youtube-wallpaper';
const LOOP_THRESHOLD_SECONDS = 1.5;
const API_LOAD_TIMEOUT_MS = 15000;

let apiPromise = null;
let player = null;
let currentToken = '';
let currentVideoId = '';
let currentExtensionOrigin = '';
let loopFrameId = 0;
let preEndLoopArmed = false;

function postToHost(type, extra = {}) {
  parent.postMessage({
    source: BRIDGE_SOURCE,
    type,
    token: currentToken,
    ...extra,
  }, '*');
}

function ensureYouTubeApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('YouTube IFrame API timed out'));
    }, API_LOAD_TIMEOUT_MS);

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeoutId);
      resolve(window.YT);
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load YouTube IFrame API'));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}

function setPlayerVisible(visible) {
  document.body.classList.toggle('is-playing', visible);
}

function stopLoopMonitor() {
  if (loopFrameId) {
    cancelAnimationFrame(loopFrameId);
    loopFrameId = 0;
  }
  preEndLoopArmed = false;
}

function destroyPlayer() {
  stopLoopMonitor();
  setPlayerVisible(false);

  if (player?.destroy) {
    player.destroy();
  }
  player = null;

  const root = document.getElementById('youtube-player-root');
  if (root) root.innerHTML = '';
}

function getNumericValue(getter, fallback = 0) {
  try {
    const value = getter();
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function buildPlayerVars(videoId, origin) {
  return {
    autoplay: 1,
    mute: 1,
    controls: 0,
    showinfo: 0,
    rel: 0,
    modestbranding: 1,
    iv_load_policy: 3,
    playsinline: 1,
    enablejsapi: 1,
    loop: 1,
    playlist: videoId,
    fs: 0,
    disablekb: 1,
    origin,
    widget_referrer: origin,
  };
}

function startLoopMonitor(token) {
  stopLoopMonitor();

  const tick = () => {
    if (token !== currentToken || !player || !window.YT) return;

    const state = getNumericValue(() => player.getPlayerState(), -1);
    if (state === window.YT.PlayerState.PLAYING) {
      const duration = getNumericValue(() => player.getDuration(), 0);
      const currentTime = getNumericValue(() => player.getCurrentTime(), 0);

      if (duration > LOOP_THRESHOLD_SECONDS + 0.75 && currentTime >= duration - LOOP_THRESHOLD_SECONDS) {
        if (!preEndLoopArmed) {
          preEndLoopArmed = true;
          player.seekTo(0, true);
          player.playVideo();
        }
      } else if (currentTime < Math.max(1, duration - (LOOP_THRESHOLD_SECONDS * 2))) {
        preEndLoopArmed = false;
      }
    }

    loopFrameId = requestAnimationFrame(tick);
  };

  loopFrameId = requestAnimationFrame(tick);
}

function handlePlayerStateChange(event) {
  if (!window.YT) return;

  switch (event.data) {
    case window.YT.PlayerState.PLAYING:
      setPlayerVisible(true);
      postToHost('playing');
      startLoopMonitor(currentToken);
      break;
    case window.YT.PlayerState.BUFFERING:
      postToHost('buffering');
      break;
    case window.YT.PlayerState.CUED:
      setPlayerVisible(false);
      postToHost('cued');
      break;
    case window.YT.PlayerState.UNSTARTED:
      setPlayerVisible(false);
      postToHost('unstarted');
      break;
    case window.YT.PlayerState.ENDED:
      event.target.seekTo(0, true);
      event.target.playVideo();
      postToHost('ended');
      break;
    case window.YT.PlayerState.PAUSED:
      event.target.playVideo();
      postToHost('paused');
      break;
    default:
      break;
  }
}

async function initPlayer(token, videoId, extensionOrigin) {
  currentToken = token;
  currentVideoId = videoId;
  currentExtensionOrigin = extensionOrigin || '';
  setPlayerVisible(false);

  try {
    const YT = await ensureYouTubeApi();
    if (token !== currentToken) return;

    destroyPlayer();
    currentToken = token;
    currentVideoId = videoId;
    currentExtensionOrigin = extensionOrigin || '';

    player = new YT.Player('youtube-player-root', {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: buildPlayerVars(videoId, currentExtensionOrigin),
      events: {
        onReady: (event) => {
          postToHost('ready');
          event.target.mute();
          event.target.playVideo();
        },
        onStateChange: handlePlayerStateChange,
        onError: (event) => {
          setPlayerVisible(false);
          postToHost('error', { code: event.data });
        },
      },
    });
  } catch (error) {
    setPlayerVisible(false);
    postToHost('error', { code: 'api-init', message: error?.message || 'Failed to initialize player' });
  }
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== HOST_SOURCE) return;

  if (data.type === 'init' && data.token && data.videoId) {
    initPlayer(data.token, data.videoId, data.extensionOrigin);
    return;
  }

  if (data.type === 'destroy' && (!data.token || data.token === currentToken)) {
    currentToken = '';
    currentVideoId = '';
    currentExtensionOrigin = '';
    destroyPlayer();
  }
});
