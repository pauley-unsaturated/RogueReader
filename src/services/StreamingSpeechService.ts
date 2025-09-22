import { SpeechRecognitionResult } from './SpeechRecognitionService'

export interface StreamingOptions {
  targetWord: string
  onPartialResult?: (text: string) => void
  onFinalResult: (result: SpeechRecognitionResult) => void
  maxDuration?: number
}

export class StreamingSpeechService {
  private apiKey: string
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private currentStream: MediaStream | null = null
  private isRecording: boolean = false
  private chunkInterval: number | null = null
  private recognizedWords: Set<string> = new Set()
  private accumulatedAudio: Blob[] = []

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenAI API key not found')
    }
  }

  async startStreaming(options: StreamingOptions): Promise<void> {
    try {
      // Detect browser
      const userAgent = navigator.userAgent
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')

      // Get microphone stream
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      console.log('🎤 Streaming started for word:', options.targetWord)

      // Reset state
      this.audioChunks = []
      this.accumulatedAudio = []
      this.recognizedWords.clear()
      this.isRecording = true

      // Determine best audio format
      const mimeType = this.getBestMimeType()

      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: mimeType
      })

      // Collect audio chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
          this.accumulatedAudio.push(event.data) // Keep full recording
        }
      }

      // Start recording with reasonable timeslice
      // Safari needs larger timeslices
      const timeslice = isSafari ? 500 : 250
      this.mediaRecorder.start(timeslice)
      console.log(`🎤 Recording with ${timeslice}ms timeslice`)

      // Don't process chunks automatically - wait for stop

      // Set max duration timeout
      const maxDuration = options.maxDuration || 10000
      setTimeout(() => {
        this.stopStreaming()
      }, maxDuration)

    } catch (error) {
      console.error('Failed to start streaming:', error)
      options.onFinalResult({
        text: '',
        confidence: 0,
        isCriticalHit: false,
        isTimeout: false,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Streaming failed'
      })
    }
  }


  async getRecordedAudio(): Promise<Blob | null> {
    if (this.accumulatedAudio.length === 0) {
      console.log('⚠️ No audio recorded')
      return null
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
    const audioBlob = new Blob(this.accumulatedAudio, { type: mimeType })
    console.log(`🎣 Complete recording: ${audioBlob.size} bytes (${mimeType})`)
    return audioBlob
  }

  stopStreaming(): void {
    console.log('🛑 Stopping stream')

    if (this.chunkInterval) {
      clearInterval(this.chunkInterval)
      this.chunkInterval = null
    }

    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false
      this.mediaRecorder.stop()
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop())
      this.currentStream = null
    }
  }

  private getBestMimeType(): string {
    const userAgent = navigator.userAgent
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')

    console.log(`🌐 Browser detected: ${isSafari ? 'Safari' : 'Other'}`)

    // Safari-first mime types
    const mimeTypes = isSafari ? [
      'audio/mp4;codecs=mp4a.40.2',  // Safari preferred
      'audio/mp4',                   // Safari fallback
      'audio/webm',                  // Last resort
    ] : [
      'audio/webm;codecs=opus',      // Chrome/Firefox preferred
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/webm'
    ]

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log(`📼 Using mime type: ${mimeType}`)
        return mimeType
      }
    }

    console.warn('⚠️ No supported mime type found, using default')
    return isSafari ? 'audio/mp4' : 'audio/webm'
  }
}