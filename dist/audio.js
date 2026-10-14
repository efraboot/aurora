export const SESSION_SECONDS = 2700;
export const PROLOGUE_SECONDS = 0;
// Marcas de edición HH:MM:SS:FF; contador nominal 24, reproducción 23,97 FPS.
export const AURORA_END = (125 * 24 + 8) / 23.97;
export const AMBITION_START = (129 * 24 + 4) / 23.97;
export const TRACKS = [
  { title: 'Aurora / Ambición', src: 'assets/audio/01.mp3', duration: 399.576 },
  { title: 'Sacrilegio', src: 'assets/audio/02.mp3', duration: 162.888 },
  { title: 'Abismo', src: 'assets/audio/03.mp3', duration: 277.920 },
  { title: 'E35', src: 'assets/audio/04.mp3', duration: 295.488 },
  { title: 'Radio Comunitaria', src: 'assets/audio/05.mp3', duration: 198.768 },
  { title: 'Resistencia', src: 'assets/audio/06.mp3', duration: 204.816 },
  { title: 'Cosecha', src: 'assets/audio/07.mp3', duration: 345.864 },
  { title: 'Av. Carchi', src: 'assets/audio/08.mp3', duration: 364.704 },
  { title: 'Wiracocha', src: 'assets/audio/09.mp3', duration: 235.248 }
];
export const CHAPTERS = [
  { title: 'Aurora', subtitle: 'Recoge 3 tejidos y enciende el primer faro.', objective: 'Recoge 3 tejidos y enciende el faro.', objectives: ['Recoge 3 tejidos.', 'Enciende el primer faro.'] },
  { title: 'Ambición', subtitle: 'Activa los mecanismos y derrota al jefe de la patrulla.', objective: 'Abre los pasos y derrota al jefe.', objectives: ['Activa los mecanismos.', 'Derrota al jefe de la patrulla.'] },
  { title: 'Sacrilegio', subtitle: 'Activa los símbolos y libera el acceso al jefe.', objective: 'Resuelve la secuencia y derrota al jefe.', objectives: ['Activa los símbolos en el orden indicado.', 'Derrota al jefe.'] },
  { title: 'Abismo', subtitle: 'Habilita los pasos del cañón y supera el enfrentamiento.', objective: 'Abre los pasos y derrota al jefe.', objectives: ['Activa los mecanismos para cruzar.', 'Derrota al jefe.'] },
  { title: 'E35', subtitle: 'Lleva el mensaje y despeja la ruta de montaña.', objective: 'Conecta las estaciones y derrota al jefe.', objectives: ['Abre los pasos y conecta las estaciones.', 'Derrota al jefe de la ruta.'] },
  { title: 'Radio Comunitaria', subtitle: 'Conecta las estaciones y asegura la ruta.', objective: 'Conecta las estaciones y derrota al jefe.', objectives: ['Conecta 3 estaciones.', 'Derrota al jefe.'] },
  { title: 'Resistencia', subtitle: 'Abre el camino y enfrenta al mando conquistador.', objective: 'Completa los mecanismos y derrota al jefe.', objectives: ['Activa los mecanismos.', 'Derrota al mando conquistador.'] },
  { title: 'Cosecha', subtitle: 'Abre los canales y completa el recorrido.', objective: 'Activa el riego y derrota al jefe.', objectives: ['Activa el canal de riego.', 'Derrota al jefe.'] },
  { title: 'Av. Carchi', subtitle: 'Revisa las conexiones y despeja el último acceso.', objective: 'Conecta las estaciones y derrota al jefe.', objectives: ['Conecta las estaciones.', 'Derrota al jefe.'] },
  { title: 'Wiracocha', subtitle: 'Completa el último recorrido y el enfrentamiento final.', objective: 'Abre el último paso y derrota al jefe final.', objectives: ['Completa los mecanismos.', 'Derrota al jefe final.'] }
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const positive = n => Math.max(0, finite(n));
const MUSIC_VOLUME = .85;

// A campaign advances when its objectives are completed. MP3 endings loop the
// current level; SESSION_SECONDS remains an informational legacy export only.
export class MusicJourney {
  constructor({ onError = () => {} } = {}) {
    this.audio = new Audio(TRACKS[0].src);
    this.audio.preload = 'auto';
    this.audio.playsInline = true;
    this.volume = MUSIC_VOLUME;
    this.audio.volume = MUSIC_VOLUME;
    this.effectVolume = .18;
    this.onError = onError;
    this.paused = true;
    this.loading = false;
    this.phase = 'music';
    this.chapter = 0;
    this.elapsed = 0;
    this.levelElapsed = 0;
    this.loops = 0;
    this.totalLoops = 0;
    this.trackIndex = 0;
    this.finished = false;
    this._introCompleted = false;
    this._generation = 0;
    this._loadSerial = 0;
    this._cache = new Map();
    this._loadedTrackIndex = 0;
    this._desiredPosition = 0;
    this._loadingTrack = false;
    this._looping = false;
    this._transition = null;
    this._transitionPromise = null;
    this._transitionResolve = null;
    this._transitionWork = false;
    this._birdCountdown = 4;
    this.audio.addEventListener('ended', () => {
      if (!this._priming && !this._loadingTrack && !this.finished) this._loopCurrent();
    });
    this.audio.addEventListener('waiting', () => {
      if (!this._priming && !this.paused && !this.finished) this.loading = true;
    });
    this.audio.addEventListener('playing', () => {
      if (!this._priming && !this._loadingTrack) this.loading = false;
      if (this.paused) this.audio.pause();
    });
    this.audio.addEventListener('error', () => {
      if (!this._priming && !this._loadingTrack && !this.finished)
        this._fail('No se pudo cargar la música. Pulsa «Continuar» para reintentar.');
    });
  }

  _createAmbience() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.effectGain = this.context.createGain();
    this.effectGain.gain.value = this.effectVolume;
    this.effectGain.connect(this.context.destination);
    this.windGain = this.context.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.effectGain);
  }

  _applyMusicVolume() {
    this.volume = MUSIC_VOLUME;
    const transition = this._transition;
    const factor = transition
      ? transition.stage === 'loading' ? 0 : 1 - clamp(transition.elapsed / Math.max(.001, transition.fadeSeconds), 0, 1)
      : 1;
    this.audio.volume = this._priming ? 0 : MUSIC_VOLUME * factor;
  }

  _cancelTransition() {
    if (this._transitionResolve) this._transitionResolve(false);
    this._transition = null;
    this._transitionPromise = null;
    this._transitionResolve = null;
    this._transitionWork = false;
  }

  _makeTransitionPromise() {
    this._transitionPromise = new Promise(resolve => { this._transitionResolve = resolve; });
    return this._transitionPromise;
  }

  // Invoked directly from the user's Start/Continue gesture to unlock iOS audio.
  async start(saved = null) {
    const generation = ++this._generation;
    ++this._loadSerial;
    this._cancelTransition();
    this.audio.pause();
    this._loadingTrack = false;
    this._looping = false;
    this.loading = true;
    this.paused = false;
    this.finished = false;
    this._priming = true;
    this.audio.volume = 0;
    this._createAmbience();
    this.context?.resume().catch(() => {});
    let prime;
    try { prime = this.audio.play(); } catch { prime = Promise.reject(); }
    try { await prime; } catch { /* Continue supplies another user gesture. */ }
    if (generation !== this._generation) return false;
    this.audio.pause();
    this._priming = false;

    // Root uses a v3 save key; no old session/epilogue is migrated.
    const restore = saved?.version === 3 ? saved : null;
    const savedTransition = restore?.transition;
    const initialIndex = restore ? clamp(Math.trunc(finite(restore.trackIndex)), 0, TRACKS.length - 1) : 0;
    const initialTime = restore ? positive(restore.trackTime) : 0;
    this.trackIndex = initialIndex;
    this.chapter = restore
      ? clamp(Math.trunc(finite(restore.chapter, initialIndex ? initialIndex + 1 : initialTime >= AMBITION_START ? 1 : 0)), 0, 9)
      : 0;
    this._introCompleted = !!restore?.introCompleted || initialIndex > 0 || this.chapter >= 1 || initialTime >= AMBITION_START;
    if (initialIndex > 0 && savedTransition?.stage !== 'loading') this.chapter = initialIndex + 1;
    else if (this._introCompleted) this.chapter = 1;
    this.elapsed = restore ? positive(restore.elapsed) : 0;
    this.levelElapsed = restore ? positive(restore.levelElapsed) : 0;
    this.loops = restore ? Math.trunc(positive(restore.loops)) : 0;
    this.totalLoops = restore ? Math.trunc(positive(restore.totalLoops)) : 0;
    this.phase = restore?.phase === 'ended' ? 'ended' : 'music';
    this.finished = this.phase === 'ended';
    this._desiredPosition = initialTime;
    if (!this.finished && savedTransition && ['advance', 'finish'].includes(savedTransition.kind)) {
      const nextChapter = clamp(Math.trunc(finite(savedTransition.nextChapter, this.chapter)), 1, 9);
      this._transition = {
        kind: savedTransition.kind,
        nextChapter,
        fadeSeconds: Math.max(.001, positive(savedTransition.fadeSeconds) || 3),
        elapsed: positive(savedTransition.elapsed),
        stage: savedTransition.stage === 'loading' ? 'loading' : 'fade',
      };
      this.phase = 'transition';
      this._makeTransitionPromise();
    }
    this.loading = false;
    this._applyMusicVolume();
    if (this.finished) { this.pause(); return true; }
    if (this._transition?.stage === 'loading') return this._finishTransitionLoad();
    return this._playTrack(this.trackIndex, initialTime);
  }

  async _cacheTrack(index) {
    if (index < 0 || index >= TRACKS.length) return null;
    if (!this._cache.has(index)) {
      const promise = fetch(TRACKS[index].src)
        .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.blob(); })
        .then(blob => URL.createObjectURL(blob));
      this._cache.set(index, promise);
      promise.catch(() => { if (this._cache.get(index) === promise) this._cache.delete(index); });
    }
    return this._cache.get(index);
  }

  _trimCache(index) {
    // Retain the current track and the next prefetch, including after restores.
    for (const [key, promise] of this._cache) if (key !== index && key !== index + 1) {
      promise.then(url => URL.revokeObjectURL(url)).catch(() => {});
      this._cache.delete(key);
    }
  }

  async _playTrack(index, position = 0) {
    const generation = this._generation, serial = ++this._loadSerial;
    const current = () => generation === this._generation && serial === this._loadSerial;
    this._desiredPosition = positive(position);
    this._loadingTrack = true;
    this.loading = true;
    this.audio.pause();
    try {
      const url = await this._cacheTrack(index);
      if (!current()) return false;
      this.audio.src = url;
      this._applyMusicVolume();
      this.audio.load();
      if (this.audio.readyState < 1) await new Promise((resolve, reject) => {
        const loaded = () => { cleanup(); resolve(); };
        const failed = () => { cleanup(); reject(new Error('audio')); };
        const timeout = setTimeout(failed, 30000);
        const cleanup = () => {
          clearTimeout(timeout);
          this.audio.removeEventListener('loadedmetadata', loaded);
          this.audio.removeEventListener('error', failed);
        };
        this.audio.addEventListener('loadedmetadata', loaded, { once: true });
        this.audio.addEventListener('error', failed, { once: true });
      });
      if (!current()) return false;
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) TRACKS[index].duration = this.audio.duration;
      this.audio.currentTime = clamp(this._desiredPosition, 0, Math.max(0, finite(this.audio.duration, TRACKS[index].duration) - .02));
      this._loadedTrackIndex = index;
      if (!this.paused) await this.audio.play();
      if (!current()) return false;
      if (this.paused) this.audio.pause();
      this.loading = false;
      this._cacheTrack(index + 1).catch(() => {});
      this._trimCache(index);
      return true;
    } catch {
      if (current()) this._fail('La música necesita un momento. Pulsa «Continuar» para reintentar.');
      return false;
    } finally {
      if (current()) this._loadingTrack = false;
    }
  }

  _syncIntro() {
    if (this.trackIndex === 0 && !this._introCompleted && this.audio.currentTime >= AMBITION_START) {
      this._introCompleted = true;
      this.chapter = 1;
      this.levelElapsed = 0;
    }
  }

  async _loopCurrent() {
    if (this._looping || this._loadingTrack || this.paused || this.finished || this._transition?.stage === 'loading') return false;
    const generation = this._generation, serial = this._loadSerial, index = this.trackIndex;
    const current = () => generation === this._generation && serial === this._loadSerial && index === this.trackIndex;
    this._looping = true;
    this.loading = true;
    const start = index === 0 ? AMBITION_START : 0;
    if (index === 0) {
      this._introCompleted = true;
      this.chapter = 1;
    }
    this.loops++;
    this.totalLoops++;
    this._desiredPosition = start;
    this.audio.currentTime = start;
    this._applyMusicVolume();
    try {
      if (!this.paused) await this.audio.play();
      if (!current()) return false;
      if (this.paused) this.audio.pause();
      this.loading = false;
      return true;
    } catch {
      if (current()) this._fail('Pulsa «Continuar» para reanudar la canción del nivel.');
      return false;
    } finally { if (current()) this._looping = false; }
  }

  advanceLevel(nextChapter, { fadeSeconds = 3 } = {}) {
    nextChapter = Math.trunc(finite(nextChapter, -1));
    if (nextChapter < 1 || nextChapter > 9) return Promise.reject(new RangeError('El siguiente capítulo debe estar entre 1 y 9.'));
    if (this._transitionPromise) return this._transitionPromise;
    if (this.finished || nextChapter <= this.chapter) return Promise.resolve(false);
    return this._beginTransition('advance', nextChapter, fadeSeconds);
  }

  finishCampaign({ fadeSeconds = 3 } = {}) {
    if (this._transitionPromise) return this._transitionPromise;
    if (this.finished) return Promise.resolve(false);
    return this._beginTransition('finish', this.chapter, fadeSeconds);
  }

  completeFinal(options) { return this.finishCampaign(options); }

  _beginTransition(kind, nextChapter, fadeSeconds) {
    this._transition = { kind, nextChapter, fadeSeconds: Math.max(.001, positive(fadeSeconds)), elapsed: 0, stage: 'fade' };
    this.phase = 'transition';
    return this._makeTransitionPromise();
  }

  async _finishTransitionLoad() {
    if (this._transitionWork || !this._transition) return false;
    const transition = this._transition, generation = this._generation;
    this._transitionWork = true;
    transition.stage = 'loading';
    this.audio.pause();
    this._applyMusicVolume();
    if (transition.kind === 'finish') {
      this.finished = true;
      this.phase = 'ended';
      this.loading = false;
      this._resolveTransition(true);
      this.pause();
      return true;
    }
    const nextIndex = transition.nextChapter <= 1 ? 0 : transition.nextChapter - 1;
    const position = nextIndex === 0 ? AMBITION_START : 0;
    this.trackIndex = nextIndex;
    const loaded = await this._playTrack(nextIndex, position);
    if (generation !== this._generation || this._transition !== transition) return false;
    this._transitionWork = false;
    if (!loaded) return false; // Transition remains saved/retryable.
    this.chapter = transition.nextChapter;
    this._introCompleted = true;
    this.loops = 0;
    this.levelElapsed = 0;
    this.phase = 'music';
    this._resolveTransition(true);
    this._applyMusicVolume();
    return true;
  }

  _resolveTransition(result) {
    const resolve = this._transitionResolve;
    this._transition = null;
    this._transitionPromise = null;
    this._transitionResolve = null;
    this._transitionWork = false;
    resolve?.(result);
  }

  _fail(text) { this.loading = false; this.pause(); this.onError(text); }

  tick(dt) {
    if (this.paused || this.loading || this.finished || this._priming) return;
    const activeSeconds = positive(dt);
    this.elapsed += activeSeconds;
    this.levelElapsed += activeSeconds;
    this._syncIntro();
    if (this._transition?.stage === 'fade') {
      this._transition.elapsed = Math.min(this._transition.fadeSeconds, this._transition.elapsed + activeSeconds);
      this._applyMusicVolume();
      if (this._transition.elapsed >= this._transition.fadeSeconds) this._finishTransitionLoad();
    }
  }

  get state() {
    const time = this._loadingTrack || this._loadedTrackIndex !== this.trackIndex
      ? this._desiredPosition : positive(this.audio.currentTime);
    // The first intro switch is clocked by audio, not the gameplay frame count.
    const chapter = this.trackIndex === 0 && !this._introCompleted && time >= AMBITION_START ? 1 : this.chapter;
    const start = this.trackIndex === 0 && chapter >= 1 ? AMBITION_START : 0;
    const length = this.trackIndex === 0 && chapter === 0 ? AURORA_END : TRACKS[this.trackIndex].duration - start;
    const progress = clamp((time - start) / Math.max(.001, length), 0, 1);
    return {
      elapsed: this.elapsed, levelElapsed: this.levelElapsed, chapter,
      chapterProgress: progress, phase: this.phase, trackIndex: this.trackIndex,
      trackTime: time, loops: this.loops, totalLoops: this.totalLoops,
      loading: this.loading, paused: this.paused, finished: this.finished,
      transitionProgress: this._transition ? clamp(this._transition.elapsed / this._transition.fadeSeconds, 0, 1) : 0,
      riser: this.phase === 'music' && this.trackIndex === 0 && !this._introCompleted && time >= AURORA_END && time < AMBITION_START,
    };
  }

  pause() { this.paused = true; this.audio.pause(); this.context?.suspend().catch(() => {}); }

  async resume() {
    if (this.finished) return false;
    const generation = this._generation, serial = this._loadSerial;
    this.context?.resume().catch(() => {});
    this.paused = false;
    if (this._loadingTrack) return false;
    if (this._transition?.stage === 'loading') return this._finishTransitionLoad();
    if (!this.audio.src || this.audio.error || this._loadedTrackIndex !== this.trackIndex) {
      const position = this._loadedTrackIndex === this.trackIndex
        ? positive(this.audio.currentTime) : this._desiredPosition;
      return this._playTrack(this.trackIndex, position);
    }
    if (this.audio.ended) return this._loopCurrent();
    try {
      this._applyMusicVolume();
      await this.audio.play();
      if (generation !== this._generation || serial !== this._loadSerial) return false;
      if (this.paused) this.audio.pause();
      this.loading = false;
      return true;
    } catch {
      if (generation === this._generation && serial === this._loadSerial) this._fail('Toca «Continuar» para activar la música.');
      return false;
    }
  }

  stop() {
    ++this._generation;
    ++this._loadSerial;
    this._cancelTransition();
    this.pause();
    this._priming = false;
    this.loading = false;
    this._loadingTrack = false;
    this._looping = false;
  }

  // Music remains at a fixed level even if old saved settings pass another value.
  setVolume() { this._applyMusicVolume(); }

  setEffectVolume(value) {
    this.effectVolume = clamp(finite(value, .18), 0, 1);
    if (this.effectGain) this.effectGain.gain.value = this.effectVolume;
  }

  exportState() {
    const state = this.state;
    return {
      version: 3, elapsed: this.elapsed, levelElapsed: this.levelElapsed,
      phase: this.phase, chapter: this.chapter, trackIndex: this.trackIndex,
      trackTime: state.trackTime, loops: this.loops, totalLoops: this.totalLoops,
      introCompleted: this._introCompleted,
      transition: this._transition ? { ...this._transition } : null,
    };
  }

  effect(kind) {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || this.effectVolume <= 0) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(this.effectGain);
    const bird = kind === 'bird', magical = ['magic', 'collective', 'interact', 'plant'].includes(kind);
    osc.type = magical || bird ? 'sine' : 'triangle';
    const f = bird ? 1750 : magical ? 540 : kind === 'hurt' ? 105 : 190;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(bird ? 2700 : magical ? f * 1.5 : 55, t + .1);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(bird ? .025 : .045, t + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, t + (magical ? .32 : .16));
    osc.start(t); osc.stop(t + .4);
  }
}
