/**
 * WhisperService - Fast speech-to-text transcription using OpenAI Whisper API
 *
 * Optimized for low-latency word verification (100-300ms target)
 * Uses Whisper base model for speed-accuracy balance
 */

export interface WhisperTranscription {
  text: string;
  confidence: number; // 0-1 score (estimated from response)
}

export class WhisperService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found for WhisperService');
    }
  }

  /**
   * Transcribe audio using Whisper API
   * @param audioBlob Audio recording to transcribe
   * @param language Language code (default: 'en')
   * @returns Transcription with confidence score
   */
  async transcribe(audioBlob: Blob, language: string = 'en'): Promise<WhisperTranscription> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log(`🎤 Whisper transcribing ${audioBlob.size} bytes...`);
      const startTime = performance.now();

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1'); // Use latest Whisper model
      formData.append('language', language);
      formData.append('response_format', 'verbose_json'); // Get detailed response with confidence

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Whisper API error:', response.status, errorText);
        throw new Error(`Whisper API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const latency = performance.now() - startTime;

      console.log(`✅ Whisper transcription complete in ${latency.toFixed(0)}ms`);
      console.log(`   Transcribed: "${result.text}"`);

      // Extract confidence from verbose response
      // Whisper doesn't provide direct confidence, so we estimate based on:
      // 1. Presence of text (high confidence if non-empty)
      // 2. Text clarity (no unusual characters, proper spacing)
      const confidence = this.estimateConfidence(result);

      return {
        text: result.text.trim(),
        confidence
      };

    } catch (error) {
      console.error('❌ Whisper transcription failed:', error);
      throw error;
    }
  }

  /**
   * Estimate confidence score from Whisper response
   * Since Whisper doesn't provide confidence scores, we use heuristics
   */
  private estimateConfidence(result: any): number {
    const text = result.text?.trim() || '';

    // Empty transcription = low confidence
    if (!text) return 0.1;

    // Check for common quality indicators
    let confidence = 1.0;

    // Reduce confidence if text has unusual patterns
    const hasMultipleSpaces = /\s{2,}/.test(text);
    const hasUnusualChars = /[^\w\s'-]/.test(text);
    const isVeryShort = text.length < 2;

    if (hasMultipleSpaces) confidence *= 0.8;
    if (hasUnusualChars) confidence *= 0.7;
    if (isVeryShort) confidence *= 0.5;

    // Use segments data if available (verbose_json format)
    if (result.segments && result.segments.length > 0) {
      // Average segment confidence if available
      const segmentConfidences = result.segments
        .map((seg: any) => seg.confidence || seg.avg_logprob || 1.0)
        .filter((c: number) => c > 0);

      if (segmentConfidences.length > 0) {
        const avgSegmentConf = segmentConfidences.reduce((a: number, b: number) => a + b) / segmentConfidences.length;
        confidence = Math.min(confidence, avgSegmentConf);
      }
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}