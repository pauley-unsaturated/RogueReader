/**
 * PronunciationAnalyzer - GPT-4o-mini powered pronunciation error analysis
 *
 * Called ONLY when Whisper transcription doesn't match target word
 * Provides child-friendly feedback on what went wrong and how to fix it
 */

export interface PronunciationFeedback {
  whatTheySaid: string; // Whisper transcription
  whatTheyShouldSay: string; // Target word (no space in property name)
  errorExplanation: string; // What phoneme/sound was wrong
  correctionTip: string; // How to make the correct sound
  practiceWords?: string[]; // Optional: similar words to practice
}

export class PronunciationAnalyzer {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found for PronunciationAnalyzer');
    }
  }

  /**
   * Analyze pronunciation error and provide feedback
   * @param targetWord The word they should have said
   * @param transcription What Whisper heard them say
   * @param gradeLevel Student's grade level (K-10)
   * @param audioBlob Optional: The actual audio recording for analysis
   * @returns Structured pronunciation feedback
   */
  async analyzePronunciation(
    targetWord: string,
    transcription: string,
    gradeLevel: number,
    audioBlob?: Blob
  ): Promise<PronunciationFeedback> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log(`🔍 Analyzing pronunciation error:`);
      console.log(`   Target: "${targetWord}"`);
      console.log(`   Heard: "${transcription}"`);
      console.log(`   Grade: ${gradeLevel}`);

      const startTime = performance.now();

      // Build prompt for GPT-4o-mini
      const prompt = this.buildAnalysisPrompt(targetWord, transcription, gradeLevel);

      // Call GPT-4o-mini (with optional audio if provided)
      const response = await this.callGPT4oMini(prompt, audioBlob);

      const latency = performance.now() - startTime;
      console.log(`✅ Pronunciation analysis complete in ${latency.toFixed(0)}ms`);

      return this.parseFeedback(response, targetWord, transcription);

    } catch (error) {
      console.error('❌ Pronunciation analysis failed:', error);
      // Return fallback feedback
      return this.getFallbackFeedback(targetWord, transcription);
    }
  }

  /**
   * Build child-friendly analysis prompt for GPT-4o-mini
   */
  private buildAnalysisPrompt(targetWord: string, transcription: string, gradeLevel: number): string {
    const gradeLabel = gradeLevel === 0 ? 'Kindergarten' : `Grade ${gradeLevel}`;

    return `You are a patient reading teacher helping a ${gradeLabel} student who is learning to read.

The student tried to say the word "${targetWord}" but it sounded like "${transcription}".

Please provide SHORT, child-friendly guidance (under 50 words total):

1. What sound they got wrong (be specific but simple)
2. How to make the correct sound (use simple terms a child understands)
3. One helpful tip to practice

Keep your language positive and encouraging. Use simple vocabulary appropriate for ${gradeLabel}.

Format your response as JSON:
{
  "errorExplanation": "...",
  "correctionTip": "...",
  "practiceWords": ["word1", "word2", "word3"]
}`;
  }

  /**
   * Call GPT-4o-mini API
   */
  private async callGPT4oMini(prompt: string, audioBlob?: Blob): Promise<string> {
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are a helpful reading teacher who provides clear, child-friendly pronunciation guidance.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // If audio provided, include it (GPT-4o-mini supports audio input)
    if (audioBlob) {
      // Convert audio to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      messages[1].content = [
        { type: 'text', text: prompt },
        { type: 'audio', audio: base64Audio }
      ];
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 200, // Keep responses concise
        temperature: 0.7 // Slight creativity for varied explanations
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GPT-4o-mini API error:', response.status, errorText);
      throw new Error(`GPT-4o-mini API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  }

  /**
   * Parse GPT-4o-mini JSON response into structured feedback
   */
  private parseFeedback(response: string, targetWord: string, transcription: string): PronunciationFeedback {
    try {
      const parsed = JSON.parse(response);

      return {
        whatTheySaid: transcription,
        whatTheyShouldSay: targetWord,
        errorExplanation: parsed.errorExplanation || 'The sounds didn\'t quite match.',
        correctionTip: parsed.correctionTip || `Practice saying "${targetWord}" slowly.`,
        practiceWords: parsed.practiceWords || []
      };

    } catch (error) {
      console.warn('Failed to parse GPT-4o-mini response, using fallback');
      return this.getFallbackFeedback(targetWord, transcription);
    }
  }

  /**
   * Provide fallback feedback if GPT-4o-mini fails
   */
  private getFallbackFeedback(targetWord: string, transcription: string): PronunciationFeedback {
    // Simple fallback based on common patterns
    const feedback: PronunciationFeedback = {
      whatTheySaid: transcription,
      whatTheyShouldSay: targetWord,
      errorExplanation: `You said "${transcription}" but the word is "${targetWord}".`,
      correctionTip: `Listen carefully and try saying "${targetWord}" slowly.`,
      practiceWords: []
    };

    // Add specific tips for common errors
    const lower = transcription.toLowerCase();
    const target = targetWord.toLowerCase();

    if (lower.startsWith('w') && target.startsWith('r')) {
      feedback.correctionTip = 'For the /r/ sound, curl your tongue back. Try "rrr-" first.';
    } else if (lower.includes('th') && target.includes('f')) {
      feedback.correctionTip = 'Put your top teeth on your bottom lip for the /f/ sound.';
    } else if (lower.length < target.length) {
      feedback.correctionTip = `Don't skip any sounds. Say each part: ${this.syllabify(target)}`;
    }

    return feedback;
  }

  /**
   * Simple syllable breakup for fallback
   */
  private syllabify(word: string): string {
    // Very basic syllable splitting (vowel groups)
    return word.replace(/([aeiou]+)/g, '$1-').replace(/-$/, '');
  }

  /**
   * Convert Blob to base64 for API upload
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}