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
  private isPreWarmed: boolean = false

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenAI API key not found')
    }
  }

  /**
   * Pre-warm the MediaRecorder by creating it once at game start.
   * This eliminates the initialization delay on first recording.
   */
  async preWarmRecorder(): Promise<void> {
    if (this.isPreWarmed) {
      console.log('🔥 MediaRecorder already pre-warmed')
      return
    }

    try {
      console.log('🔥 Pre-warming MediaRecorder...')

      // DEBUG: List available audio devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(d => d.kind === 'audioinput')
        console.log('🎤 Available audio input devices:')
        audioInputs.forEach((device, i) => {
          console.log(`  ${i}: ${device.label || 'Unnamed'} (${device.deviceId.substring(0, 20)}...)`)
        })
      } catch (e) {
        console.warn('Could not enumerate devices:', e)
      }

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

      // DEBUG: Show which device was actually selected
      const audioTrack = this.currentStream.getAudioTracks()[0]
      if (audioTrack) {
        console.log('🎤 Selected audio device:', audioTrack.label)
        console.log('🎤 Audio track settings:', audioTrack.getSettings())
      }

      // Determine best audio format
      const mimeType = this.getBestMimeType()

      // Create MediaRecorder but don't start it
      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: mimeType
      })

      console.log(`🔥 MediaRecorder pre-warmed with mimeType: ${mimeType}`)
      console.log(`🔥 MediaRecorder state: ${this.mediaRecorder.state}`)

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        console.log(`📼 Audio chunk received: ${event.data.size} bytes`)
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
          this.accumulatedAudio.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        console.log(`🏁 Recording stopped - total chunks: ${this.accumulatedAudio.length}`)
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('🚨 MediaRecorder error:', event)
      }

      this.isPreWarmed = true
      console.log('✅ MediaRecorder successfully pre-warmed and ready')

    } catch (error) {
      console.error('❌ Failed to pre-warm MediaRecorder:', error)
      // Don't set isPreWarmed to true so it will try again later
    }
  }

  async startStreaming(options: StreamingOptions): Promise<void> {
    try {
      console.log('🎤 Streaming started for word:', options.targetWord)

      // Reset state
      this.audioChunks = []
      this.accumulatedAudio = []
      this.recognizedWords.clear()
      this.isRecording = true

      // Check if we have a pre-warmed recorder
      if (this.isPreWarmed && this.mediaRecorder && this.currentStream) {
        console.log('🔥 Using pre-warmed MediaRecorder')
        // Recorder is already set up and ready!
      } else {
        console.log('⚠️ MediaRecorder not pre-warmed, creating now...')

        // Fallback: Create recorder on demand (shouldn't happen if pre-warming worked)
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

        // Determine best audio format
        const mimeType = this.getBestMimeType()

        this.mediaRecorder = new MediaRecorder(this.currentStream, {
          mimeType: mimeType
        })

        console.log(`🎤 MediaRecorder created with mimeType: ${mimeType}`)
        console.log(`🎤 MediaRecorder state: ${this.mediaRecorder.state}`)

        // Collect audio chunks
        this.mediaRecorder.ondataavailable = (event) => {
          console.log(`📼 Audio chunk received: ${event.data.size} bytes`)
          if (event.data.size > 0) {
            this.audioChunks.push(event.data)
            this.accumulatedAudio.push(event.data)
          } else if (this.audioChunks.length === 0 && this.mediaRecorder?.state === 'recording') {
            console.warn('⚠️ Received empty chunk with no previous data - mic may not be ready')
          }
        }

        // Handle recording stop
        this.mediaRecorder.onstop = () => {
          console.log(`🏁 Recording stopped - total chunks: ${this.accumulatedAudio.length}`)
          if (this.accumulatedAudio.length === 0) {
            console.warn('🚨 MediaRecorder stopped but no audio chunks were captured!')
          }
        }

        // Add error handler
        this.mediaRecorder.onerror = (event) => {
          console.error('🚨 MediaRecorder error:', event)
        }
      }

      // Detect browser
      const userAgent = navigator.userAgent
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')

      // Start recording with reasonable timeslice
      // Safari needs larger timeslices
      const timeslice = isSafari ? 500 : 250

      // Start recording immediately
      if (this.mediaRecorder.state === 'inactive') {
        this.mediaRecorder.start(timeslice)
        console.log(`🎤 Recording started with ${timeslice}ms timeslice`)
      } else {
        console.warn(`⚠️ MediaRecorder not ready: state=${this.mediaRecorder.state}`)
      }

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
    console.log(`📋 Checking recorded audio: ${this.accumulatedAudio.length} chunks`)

    // FIX: Longer delay for Safari to finalize audio chunks
    // Safari can take 300-500ms to flush buffers and fire ondataavailable
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check again after delay
    console.log(`📋 After delay: ${this.accumulatedAudio.length} chunks`)

    if (this.accumulatedAudio.length === 0) {
      console.log('⚠️ No audio chunks recorded - possible MediaRecorder issue')
      console.log('💡 This can happen if:')
      console.log('   1. Microphone permissions were denied')
      console.log('   2. Recording stopped before first timeslice boundary')
      console.log('   3. Browser-specific MediaRecorder bug')
      return null
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
    const audioBlob = new Blob(this.accumulatedAudio, { type: mimeType })
    console.log(`🎣 Complete recording: ${audioBlob.size} bytes (${mimeType})`)

    if (audioBlob.size === 0) {
      console.log('⚠️ Audio blob is empty despite having chunks')
      return null
    }

    return audioBlob
  }

  async stopStreaming(): Promise<void> {
    try {
      console.log('🛑 Stopping stream')

      if (this.chunkInterval) {
        clearInterval(this.chunkInterval)
        this.chunkInterval = null
      }

      if (this.mediaRecorder && this.isRecording) {
        this.isRecording = false

        // FIX: Wait for onstop event to ensure all chunks are captured
        // The onstop event is guaranteed to fire after all ondataavailable events
        const stopPromise = new Promise<void>((resolve) => {
          if (!this.mediaRecorder) {
            resolve()
            return
          }

          // Set up one-time stop handler with timeout to prevent hanging
          const originalOnStop = this.mediaRecorder.onstop
          let resolved = false

          const stopHandler = () => {
            if (resolved) return
            resolved = true

            console.log(`🏁 Recording stopped - total chunks: ${this.accumulatedAudio.length}`)
            if (this.accumulatedAudio.length === 0) {
              console.warn('🚨 MediaRecorder stopped but no audio chunks were captured!')
            }
            // Call original handler if it exists
            if (originalOnStop && this.mediaRecorder) {
              try {
                originalOnStop.call(this.mediaRecorder, new Event('stop'))
              } catch (err) {
                console.warn('Error in original onstop handler:', err)
              }
            }
            resolve()
          }

          this.mediaRecorder.onstop = stopHandler

          // Safety timeout: resolve after 2 seconds even if onstop doesn't fire
          setTimeout(() => {
            if (!resolved) {
              console.warn('⏱️  MediaRecorder stop timeout - resolving anyway')
              stopHandler()
            }
          }, 2000)
        })

        // Force a final chunk by requesting data
        console.log('📡 Requesting final audio data...')
        this.mediaRecorder.requestData()

        // Wait a moment for requestData to process (Safari needs this)
        await new Promise(resolve => setTimeout(resolve, 100))

        console.log('⏹️  Stopping MediaRecorder...')
        this.mediaRecorder.stop()

        // Wait for the stop event to complete
        await stopPromise
        console.log('✅ MediaRecorder fully stopped, chunks captured')
      }

      // Don't stop the stream if it's pre-warmed - we want to keep it alive
      // Only stop it if we're fully cleaning up
      if (!this.isPreWarmed && this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop())
        this.currentStream = null
      }
    } catch (error) {
      // Suppress errors for fire-and-forget cleanup calls
      console.warn('⚠️ Error stopping stream (suppressed):', error)
    }
  }

  /**
   * Fully cleanup the pre-warmed recorder and release microphone access.
   * Call this when the game ends or when switching scenes.
   */
  cleanupPreWarmedRecorder(): void {
    console.log('🧹 Cleaning up pre-warmed MediaRecorder')

    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
      this.mediaRecorder = null
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop()
        console.log('🎤 Microphone track stopped')
      })
      this.currentStream = null
    }

    this.isPreWarmed = false
    this.isRecording = false
    this.audioChunks = []
    this.accumulatedAudio = []
  }

  private getBestMimeType(): string {
    const userAgent = navigator.userAgent
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')

    console.log(`🌐 Browser detected: ${isSafari ? 'Safari' : 'Other'}`)

    // Simplified, more compatible mime types
    const mimeTypes = isSafari ? [
      'audio/mp4',                   // Safari simple MP4
      'audio/webm',                  // Basic WebM fallback
    ] : [
      'audio/webm;codecs=opus',      // Chrome/Firefox preferred
      'audio/webm',                  // Simple WebM
      'audio/mp4',                   // MP4 fallback
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