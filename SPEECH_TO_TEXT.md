# Speech-to-Text Implementation Guide

## Overview
This document outlines the speech-to-text options available from OpenAI and implementation strategies for RogueReader.

## Model Comparison

| Model | Latency | Quality | Streaming | Features |
|-------|---------|---------|-----------|----------|
| `whisper-1` | Higher | Good | No | Full features (timestamps, verbose JSON) |
| `gpt-4o-mini-transcribe` | **Lower** | Good | **Yes** | Limited (JSON/text only) |
| `gpt-4o-transcribe` | Lower | **Best** | **Yes** | Limited (JSON/text only) |

## Implementation Options for Low Latency

### Option 1: HTTP Streaming (Recommended for RogueReader)
Best for: Completed audio chunks (like our 2-second recordings)

```javascript
const stream = await openai.audio.transcriptions.create({
  file: audioBlob,
  model: "gpt-4o-mini-transcribe", // Fast, low latency
  response_format: "text",
  stream: true, // KEY: Enable streaming
  prompt: `The user is trying to say: ${targetWord}`
});

for await (const event of stream) {
  // Process incremental transcription
  console.log(event);
}
```

**Advantages:**
- Simple to implement with existing code
- Lower latency than waiting for full response
- Works with audio chunks/blobs

**Implementation Steps:**
1. Record 1-2 second audio chunks
2. Send each chunk with `stream: true`
3. Process results as they arrive
4. Stop recording when word is matched

### Option 2: WebSocket Realtime API
Best for: Continuous audio streaming with VAD

```javascript
const ws = new WebSocket('wss://api.openai.com/v1/realtime?intent=transcription');

// Configure session
ws.send(JSON.stringify({
  type: "transcription_session.update",
  input_audio_format: "pcm16",
  input_audio_transcription: {
    model: "gpt-4o-transcribe",
    prompt: "The user is saying single words",
    language: "en"
  },
  turn_detection: {
    type: "server_vad",
    threshold: 0.5,
    silence_duration_ms: 500
  }
}));

// Stream audio
ws.send(JSON.stringify({
  type: "input_audio_buffer.append",
  audio: base64AudioData
}));
```

**Advantages:**
- Lowest possible latency
- Server-side voice activity detection
- Continuous streaming without chunking

**Challenges:**
- Requires PCM16 audio format conversion
- More complex WebSocket management
- Need to handle connection lifecycle

## Recommended Approach for RogueReader

### Phase 1: Quick Win - HTTP Streaming
1. Switch from `whisper-1` to `gpt-4o-mini-transcribe`
2. Add `stream: true` parameter
3. Process incremental results
4. Reduce chunk size to 1 second

### Phase 2: Optimal - WebSocket Realtime (if needed)
Only implement if Phase 1 latency is still too high.

## Key Optimizations

### 1. Use gpt-4o-mini-transcribe
- Optimized for speed
- Lower latency than whisper-1
- Good enough accuracy for single words

### 2. Reduce Audio Chunk Size
- Current: 2 seconds
- Target: 1 second or less
- Trade-off: More API calls but faster response

### 3. Prompt Engineering
```javascript
// Help the model expect single words
prompt: `The user is saying the single word: "${targetWord}"`

// For repeated words
prompt: `The user might repeat the word: "${targetWord}"`
```

### 4. Safari Compatibility
- Use MP4/AAC codec for Safari
- PCM16 for WebSocket streaming
- Detect browser and adjust accordingly

## Implementation Checklist

- [ ] Replace `whisper-1` with `gpt-4o-mini-transcribe`
- [ ] Add `stream: true` to transcription calls
- [ ] Implement async iterator for stream processing
- [ ] Reduce audio chunk duration to 1 second
- [ ] Add prompt optimization for single words
- [ ] Test latency improvements
- [ ] Consider WebSocket API if still too slow

## Latency Targets

- Current: ~3-4 seconds (whisper-1, 2-second chunks)
- Phase 1 Goal: <1.5 seconds (streaming, 1-second chunks)
- Phase 2 Goal: <500ms (WebSocket realtime)

## Code Migration Example

### Before (Current Implementation)
```javascript
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: formData
});
const data = await response.json();
```

### After (HTTP Streaming)
```javascript
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'text/event-stream'
  },
  body: formData
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process streaming chunk
  if (chunk.includes(targetWord)) {
    // Word found - stop recording
    break;
  }
}
```

## Notes

- The `stream` parameter is NOT available for `whisper-1`
- Only `json` and `text` response formats work with new models
- WebSocket API requires authentication via header or ephemeral token
- Consider user's network latency in addition to API latency