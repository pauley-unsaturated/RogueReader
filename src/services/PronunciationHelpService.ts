export interface PronunciationHelpOptions {
  word: string
  rate: number // Speech rate (0.1 to 10)
  pitch: number // Pitch (0 to 2)
  volume: number // Volume (0 to 1)
}

export class PronunciationHelpService {
  private synth: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private preferredVoice: SpeechSynthesisVoice | null = null

  constructor() {
    this.synth = window.speechSynthesis
    this.loadVoices()

    // Listen for voices loaded event
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices()
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices()

    // Prefer English voices, especially clear ones for children
    this.preferredVoice = this.voices.find(voice =>
      voice.lang.startsWith('en') &&
      (voice.name.includes('Karen') || // Mac's child-friendly voice
       voice.name.includes('Samantha') || // Mac's clear female voice
       voice.name.includes('Alex') || // Mac's clear male voice
       voice.name.includes('Google US English') || // Chrome's clear voice
       voice.name.includes('Microsoft Aria') || // Windows clear voice
       voice.name.includes('Microsoft Zira'))
    ) || this.voices.find(voice => voice.lang.startsWith('en-US'))
      || this.voices.find(voice => voice.lang.startsWith('en'))
      || this.voices[0] // Fallback to first available voice
  }

  async speakWord(options: PronunciationHelpOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(options.word)

      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice
      }

      utterance.rate = Math.max(0.1, Math.min(2.0, options.rate)) // Clamp to safe range
      utterance.pitch = Math.max(0, Math.min(2, options.pitch))
      utterance.volume = Math.max(0, Math.min(1, options.volume))

      utterance.onend = () => resolve()
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      this.synth.speak(utterance)
    })
  }

  async speakSlowly(word: string): Promise<void> {
    return this.speakWord({
      word,
      rate: 0.6, // Slower than normal
      pitch: 1.0,
      volume: 0.8
    })
  }

  async speakNormally(word: string): Promise<void> {
    return this.speakWord({
      word,
      rate: 0.9, // Slightly slower than normal for clarity
      pitch: 1.0,
      volume: 0.8
    })
  }

  async speakWithEmphasis(word: string): Promise<void> {
    return this.speakWord({
      word,
      rate: 0.8,
      pitch: 1.2, // Higher pitch for emphasis
      volume: 0.9
    })
  }

  // Break down word into syllables for pronunciation help
  async speakSyllables(word: string): Promise<void> {
    const syllables = this.breakIntoSyllables(word)

    for (let i = 0; i < syllables.length; i++) {
      await this.speakWord({
        word: syllables[i],
        rate: 0.7,
        pitch: 1.0,
        volume: 0.8
      })

      // Pause between syllables
      if (i < syllables.length - 1) {
        await this.pause(300)
      }
    }

    // Pause, then speak the whole word
    await this.pause(500)
    await this.speakNormally(word)
  }

  private breakIntoSyllables(word: string): string[] {
    // Simple syllable breaking algorithm
    // For production, you might want to use a more sophisticated library
    const vowels = 'aeiouy'
    const syllables: string[] = []
    let currentSyllable = ''

    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase()
      currentSyllable += word[i]

      if (vowels.includes(char)) {
        // Look ahead to see if we should break here
        if (i < word.length - 1) {
          const nextChar = word[i + 1].toLowerCase()
          const nextNextChar = i < word.length - 2 ? word[i + 2].toLowerCase() : ''

          // Break before consonant clusters
          if (!vowels.includes(nextChar) && vowels.includes(nextNextChar)) {
            syllables.push(currentSyllable)
            currentSyllable = ''
          }
        }
      }
    }

    if (currentSyllable) {
      syllables.push(currentSyllable)
    }

    // If we couldn't break it down, return the whole word
    return syllables.length > 1 ? syllables : [word]
  }

  private pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stop(): void {
    this.synth.cancel()
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  setPreferredVoice(voiceName: string): boolean {
    const voice = this.voices.find(v => v.name === voiceName)
    if (voice) {
      this.preferredVoice = voice
      return true
    }
    return false
  }
}