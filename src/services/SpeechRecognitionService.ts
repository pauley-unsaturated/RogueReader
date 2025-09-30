export interface SpeechRecognitionResult {
  text: string
  confidence: number
  pronunciation_score?: number
  isCriticalHit: boolean
  isTimeout: boolean
  isError: boolean
  errorMessage?: string
  pronunciationFeedback?: {
    whatTheySaid: string
    whatTheyShouldSay: string
    errorExplanation: string
    correctionTip: string
    practiceWords?: string[]
  }
}

export interface SpeechRecognitionOptions {
  targetWord: string
  timeoutMs: number
  language: string
}

export class SpeechRecognitionService {
  private apiKey: string
  private isRecording: boolean = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private currentStream: MediaStream | null = null

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenAI API key not found in environment variables')
      // Don't throw - let the service degrade gracefully
    }
  }

  async startRecording(options: SpeechRecognitionOptions): Promise<SpeechRecognitionResult> {
    try {
      // Request microphone permission with more specific constraints
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      console.log('Microphone stream acquired:', this.currentStream)
      console.log('Audio tracks:', this.currentStream.getAudioTracks())

      // Log the audio track settings
      const audioTrack = this.currentStream.getAudioTracks()[0]
      if (audioTrack) {
        console.log('Audio track label:', audioTrack.label)
        console.log('Audio track settings:', audioTrack.getSettings())
        console.log('Audio track capabilities:', audioTrack.getCapabilities ? audioTrack.getCapabilities() : 'Not supported')
      }

      this.audioChunks = []

      // Detect Safari for codec selection
      const browserInfo = this.getBrowserInfo()
      const isSafari = browserInfo.name === 'Safari'

      // Try different mime types based on browser
      const mimeTypes = isSafari ? [
        // Safari-specific order
        'audio/mp4;codecs=mp4a.40.2',  // AAC in MP4 - Safari's preferred format
        'audio/mp4',                   // Basic MP4 - Safari compatible
        'audio/webm',                  // Basic WebM - last resort
      ] : [
        // Chrome/Firefox/Edge order
        'audio/webm;codecs=opus',      // Best quality - Chrome/Firefox preferred
        'audio/ogg;codecs=opus',       // Firefox fallback
        'audio/mp4;codecs=mp4a.40.2',  // Cross-platform fallback
        'audio/mp4',                   // Basic MP4
        'audio/webm',                  // Basic WebM
        'audio/wav',                   // Uncompressed
        'audio/mpeg'                   // MP3 - legacy
      ]

      let selectedMimeType = ''
      let selectedIndex = -1

      for (let i = 0; i < mimeTypes.length; i++) {
        if (MediaRecorder.isTypeSupported(mimeTypes[i])) {
          selectedMimeType = mimeTypes[i]
          selectedIndex = i
          break
        }
      }

      // Log browser compatibility info
      console.log('Browser detection:', browserInfo)

      if (!selectedMimeType) {
        console.error('No supported audio mime type found')
        throw new Error('Browser does not support audio recording')
      }

      console.log(`✅ Selected format #${selectedIndex + 1}: ${selectedMimeType}`)
      console.log(`🎯 Optimized for: ${browserInfo.name}`)

      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: selectedMimeType
      })

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log('Recording timeout reached, stopping...')
          this.stopRecording()
          resolve({
            text: '',
            confidence: 0,
            isCriticalHit: false,
            isTimeout: true,
            isError: false
          })
        }, options.timeoutMs)

        this.mediaRecorder!.ondataavailable = (event) => {
          console.log('Data available:', event.data.size, 'bytes')
          if (event.data.size > 0) {
            this.audioChunks.push(event.data)
          }
        }

        this.mediaRecorder!.onstart = () => {
          console.log('MediaRecorder started')

          // Safari safety check: if no data after 2 seconds, something's wrong
          setTimeout(() => {
            if (this.audioChunks.length === 0) {
              console.warn('⚠️ No audio data received after 2 seconds - this may be a Safari MediaRecorder issue')
              console.log('🔄 Attempting to trigger data capture...')
              // Try to manually trigger data capture
              if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.requestData()
              }
            }
          }, 2000)
        }

        this.mediaRecorder!.onstop = async () => {
          console.log('MediaRecorder stopped, chunks:', this.audioChunks.length)
          clearTimeout(timeoutId)

          if (this.audioChunks.length === 0) {
            resolve({
              text: '',
              confidence: 0,
              isCriticalHit: false,
              isTimeout: true,
              isError: false
            })
            return
          }

          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
            const result = await this.transcribeAudio(audioBlob, options.targetWord)
            resolve(result)
          } catch (error) {
            console.error('Transcription error:', error)
            resolve({
              text: '',
              confidence: 0,
              isCriticalHit: false,
              isTimeout: false,
              isError: true,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }

        this.isRecording = true
        console.log('Starting MediaRecorder...')

        // Safari-specific fix: try different timeslice values
        try {
          if (browserInfo.name === 'Safari') {
            // Safari sometimes needs a specific timeslice to work properly
            this.mediaRecorder!.start(100) // Capture data every 100ms for Safari
            console.log('📱 Safari mode: Using 100ms timeslice')
          } else {
            this.mediaRecorder!.start(1000) // Standard 1 second for other browsers
            console.log('🖥️ Standard mode: Using 1000ms timeslice')
          }
        } catch (startError) {
          console.error('MediaRecorder start failed:', startError)
          // Try starting without timeslice parameter
          console.log('🔄 Retrying without timeslice parameter...')
          this.mediaRecorder!.start()
        }
      })
    } catch (error) {
      console.error('Failed to start recording:', error)
      return {
        text: '',
        confidence: 0,
        isCriticalHit: false,
        isTimeout: false,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Microphone access denied'
      }
    }
  }

  stopRecording(): void {
    console.log('🛑 stopRecording called')
    console.log('  - mediaRecorder exists:', !!this.mediaRecorder)
    console.log('  - isRecording:', this.isRecording)
    console.log('  - mediaRecorder state:', this.mediaRecorder?.state)

    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false
      console.log('📴 Stopping MediaRecorder...')
      this.mediaRecorder.stop()

      if (this.currentStream) {
        console.log('🔌 Stopping stream tracks...')
        this.currentStream.getTracks().forEach(track => {
          console.log(`  - Stopping track: ${track.label}`)
          track.stop()
        })
        this.currentStream = null
      }
    } else {
      console.log('⚠️ stopRecording called but conditions not met')
    }
  }

  private async transcribeAudio(audioBlob: Blob, targetWord: string): Promise<SpeechRecognitionResult> {
    console.log('Starting transcription...')
    console.log('Audio blob size:', audioBlob.size, 'bytes')
    console.log('Audio blob type:', audioBlob.type)
    console.log('Target word:', targetWord)

    try {
      // Import services dynamically
      const { WhisperService } = await import('./WhisperService')
      const { PronunciationAnalyzer } = await import('./PronunciationAnalyzer')
      const { getMatchQuality } = await import('../utils/fuzzyMatch')

      const whisperService = new WhisperService()
      const pronunciationAnalyzer = new PronunciationAnalyzer()

      // Phase 1: Fast Whisper transcription
      const whisperResult = await whisperService.transcribe(audioBlob, 'en')
      const transcribedText = whisperResult.text.toLowerCase().trim()
      const targetLower = targetWord.toLowerCase().trim()

      console.log(`Transcribed: "${transcribedText}" vs Target: "${targetLower}"`)

      // Clean transcription (remove repeated words, punctuation)
      const cleanedText = this.cleanTranscription(transcribedText, targetLower)

      // Check if it's a match using fuzzy matching
      const matchQuality = getMatchQuality(targetLower, cleanedText)
      console.log(`Match quality: ${matchQuality.quality} (${(matchQuality.similarity * 100).toFixed(1)}%)`)

      const isMatch = matchQuality.isMatch
      const isCriticalHit = matchQuality.quality === 'exact' || matchQuality.quality === 'excellent'

      // Phase 2: If NOT a match, get pronunciation feedback (GPT-4o-mini)
      let pronunciationFeedback = undefined
      if (!isMatch) {
        console.log('❌ Mismatch detected - analyzing pronunciation error...')
        try {
          const feedback = await pronunciationAnalyzer.analyzePronunciation(
            targetWord,
            cleanedText,
            1, // TODO: Get actual grade level from player
            audioBlob
          )
          pronunciationFeedback = feedback
          console.log('📚 Pronunciation feedback received:', feedback.errorExplanation)
        } catch (error) {
          console.warn('⚠️ Pronunciation analysis failed:', error)
          // Continue without feedback
        }
      }

      return {
        text: cleanedText,
        confidence: whisperResult.confidence,
        pronunciation_score: matchQuality.similarity,
        isCriticalHit,
        isTimeout: false,
        isError: false,
        pronunciationFeedback
      }
    } catch (error) {
      console.error('Transcription failed:', error)
      throw error
    }
  }

  // Helper methods for convertToWav, calculatePronunciationAccuracy, and levenshteinDistance
  // have been removed as they are now handled by WhisperService and fuzzyMatch utilities

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  private cleanTranscription(transcribedText: string, targetWord: string): string {
    // Remove punctuation and convert to lowercase
    let cleaned = transcribedText.replace(/[!.,?;]/g, '').toLowerCase().trim()

    // Handle repeated words (e.g., "rat rat" -> "rat")
    const words = cleaned.split(/\s+/)

    // If all words are the same (or variations), return just one
    if (words.length > 0) {
      const firstWord = words[0]
      const allSame = words.every(w => w === firstWord || w === targetWord)
      if (allSame) {
        return firstWord
      }
    }

    // If target word appears anywhere in the transcription, extract it
    if (words.includes(targetWord)) {
      return targetWord
    }

    // Return the full cleaned text
    return cleaned
  }

  private getBrowserInfo(): { name: string; version: string; supportsOpus: boolean } {
    const userAgent = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'
    let supportsOpus = false

    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari'
      const match = userAgent.match(/Version\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      supportsOpus = false // Safari has limited Opus support
    } else if (userAgent.includes('Chrome')) {
      name = 'Chrome'
      const match = userAgent.match(/Chrome\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      supportsOpus = true // Chrome has excellent Opus support
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox'
      const match = userAgent.match(/Firefox\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      supportsOpus = true // Firefox has excellent Opus support
    } else if (userAgent.includes('Edge')) {
      name = 'Edge'
      const match = userAgent.match(/Edge\/([0-9.]+)/)
      version = match ? match[1] : 'Unknown'
      supportsOpus = true // Edge supports Opus
    }

    return { name, version, supportsOpus }
  }
}