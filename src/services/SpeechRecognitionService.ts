export interface SpeechRecognitionResult {
  text: string
  confidence: number
  pronunciation_score?: number
  isCriticalHit: boolean
  isTimeout: boolean
  isError: boolean
  errorMessage?: string
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
      // Convert webm to wav for better Whisper compatibility
      const wavBlob = await this.convertToWav(audioBlob)
      console.log('After conversion - blob size:', wavBlob.size, 'bytes')

      const formData = new FormData()
      formData.append('file', wavBlob, 'audio.wav')
      formData.append('model', 'whisper-1')
      formData.append('language', 'en')
      formData.append('response_format', 'verbose_json')
      formData.append('prompt', `The user should say the word: ${targetWord}`)

      console.log('Sending request to Whisper API...')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      })

      console.log('API response status:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Whisper API response:', data)

      const transcribedText = data.text?.toLowerCase().trim() || ''
      const targetLower = targetWord.toLowerCase().trim()

      console.log(`Transcribed: "${transcribedText}" vs Target: "${targetLower}"`)

      // Handle repeated words and exclamations
      const cleanedText = this.cleanTranscription(transcribedText, targetLower)

      // Calculate pronunciation accuracy
      const accuracy = this.calculatePronunciationAccuracy(cleanedText, targetLower)
      console.log('Cleaned text:', cleanedText)
      console.log('Pronunciation accuracy:', accuracy)

      // Determine if it's a critical hit (95%+ accuracy)
      const isCriticalHit = accuracy >= 0.95

      // Use confidence from Whisper if available, otherwise use our accuracy calculation
      const confidence = data.confidence || accuracy

      console.log('Final result:', {
        text: transcribedText,
        confidence,
        pronunciation_score: accuracy,
        isCriticalHit
      })

      return {
        text: cleanedText,  // Return cleaned text
        confidence,
        pronunciation_score: accuracy,
        isCriticalHit,
        isTimeout: false,
        isError: false
      }
    } catch (error) {
      console.error('Transcription failed:', error)
      throw error
    }
  }

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    // For now, we'll just pass the original blob
    // In production, you might want to use a library like ffmpeg.js
    // to properly convert to WAV format
    return webmBlob
  }

  private calculatePronunciationAccuracy(spoken: string, target: string): number {
    if (!spoken || !target) return 0

    // Remove extra whitespace and punctuation
    const cleanSpoken = spoken.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    const cleanTarget = target.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()

    // Exact match gets perfect score
    if (cleanSpoken === cleanTarget) return 1.0

    // Calculate Levenshtein distance for similarity
    const distance = this.levenshteinDistance(cleanSpoken, cleanTarget)
    const maxLength = Math.max(cleanSpoken.length, cleanTarget.length)

    if (maxLength === 0) return 0

    const similarity = 1 - (distance / maxLength)

    // Give bonus for getting the word mostly right
    if (similarity > 0.7) {
      return Math.min(1.0, similarity + 0.1)
    }

    return Math.max(0, similarity)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

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