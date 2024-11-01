export class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private isMuted: boolean = false;

  private constructor() {
    this.initializeSounds();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initializeSounds() {
    if (typeof window !== 'undefined') {
      this.sounds = {
        move: new Audio('/sounds/move.mp3'),
        rotate: new Audio('/sounds/rotate.mp3'),
        drop: new Audio('/sounds/drop.mp3'),
        clear: new Audio('/sounds/clear.mp3'),
        gameOver: new Audio('/sounds/gameover.mp3')
      };

      // Preload sounds
      Object.values(this.sounds).forEach(sound => {
        sound.load();
      });
    }
  }

  public playSound(soundName: string) {
    if (this.isMuted || !this.sounds[soundName]) return;
    
    const sound = this.sounds[soundName];
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
  }
}

export const playSound = (soundName: string) => {
  SoundManager.getInstance().playSound(soundName);
};
