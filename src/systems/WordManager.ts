export interface WordData {
  word: string
  level: number
  attempts: number
  successes: number
  lastSeen: Date
  nextReview: Date
  easeFactor: number
  interval: number
}

export class WordManager {
  private wordsByLevel: Map<number, string[]> = new Map()
  private playerWordHistory: Map<string, WordData> = new Map()
  private loadPromises: Map<number, Promise<string[]>> = new Map()

  constructor() {
    this.initializeFallbackWords()
    this.initializeWordData()
  }

  private initializeFallbackWords(): void {
    // Initialize with fallback words immediately for levels 1-5
    for (let level = 1; level <= 5; level++) {
      this.wordsByLevel.set(level, this.getFallbackWords(level))
    }
  }

  private async initializeWordData(): Promise<void> {
    // Pre-load the first few levels for immediate gameplay
    // These will override the fallback words if files exist
    this.loadWordsForLevel(1)
    this.loadWordsForLevel(2)
    this.loadWordsForLevel(3)
  }

  public async loadWordsForLevel(level: number): Promise<string[]> {
    if (this.wordsByLevel.has(level)) {
      return this.wordsByLevel.get(level)!
    }

    // Prevent duplicate loading
    if (this.loadPromises.has(level)) {
      return this.loadPromises.get(level)!
    }

    const loadPromise = this.fetchWordsFromFile(level)
    this.loadPromises.set(level, loadPromise)

    const words = await loadPromise
    this.wordsByLevel.set(level, words)
    this.loadPromises.delete(level)

    return words
  }

  private async fetchWordsFromFile(level: number): Promise<string[]> {
    try {
      const response = await fetch(`/src/data/words/level-${level.toString().padStart(2, '0')}.txt`)
      const text = await response.text()

      // Parse the file, ignoring comments and empty lines
      const words = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .filter(line => line.length > 0)

      console.log(`Loaded ${words.length} words for level ${level}`)
      return words
    } catch (error) {
      console.error(`Failed to load words for level ${level}:`, error)

      // Fallback words if file loading fails
      return this.getFallbackWords(level)
    }
  }

  private getFallbackWords(level: number): string[] {
    // Provide basic fallback words if file loading fails
    const fallbacks: Record<number, string[]> = {
      1: ['cat', 'bat', 'hat', 'mat', 'rat', 'sat', 'fat', 'pat',
          'can', 'man', 'pan', 'ran', 'fan', 'van', 'tan',
          'bad', 'dad', 'had', 'mad', 'sad', 'lad',
          'bag', 'tag', 'rag', 'wag', 'lag',
          'cap', 'map', 'lap', 'tap', 'nap', 'gap'],
      2: ['bed', 'red', 'fed', 'led', 'wed',
          'ten', 'pen', 'hen', 'men', 'den',
          'net', 'pet', 'get', 'let', 'wet', 'met', 'set', 'bet',
          'big', 'dig', 'pig', 'wig', 'fig',
          'hot', 'pot', 'got', 'lot', 'dot', 'not'],
      3: ['sit', 'hit', 'bit', 'fit', 'kit', 'lit', 'pit', 'wit',
          'pin', 'win', 'bin', 'fin', 'tin', 'sin',
          'hop', 'top', 'pop', 'mop', 'cop',
          'bug', 'hug', 'jug', 'mug', 'rug', 'tug',
          'sun', 'run', 'fun', 'bun', 'gun'],
      4: ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they',
          'from', 'have', 'this', 'word', 'what', 'some', 'were', 'when', 'your', 'said'],
      5: ['about', 'after', 'again', 'could', 'every', 'first', 'found', 'great', 'house', 'large',
          'place', 'right', 'small', 'sound', 'still', 'think', 'three', 'under', 'water', 'where']
    }

    return fallbacks[level] || fallbacks[1]
  }

  // Get appropriate words based on player's reading level and spaced repetition
  public async getWordsForSpell(playerLevel: number, _spellType: 'attack' | 'defense' | 'unlock' | 'heal', count: number = 1): Promise<string[]> {
    const level = Math.min(playerLevel, 20)
    await this.loadWordsForLevel(level)

    const levelWords = this.wordsByLevel.get(level) || []
    const reviewWords = this.getWordsNeedingReview(level)
    const newWords = this.getNewWords(level, levelWords)

    // Mix of review and new words (70% review, 30% new for retention)
    const selectedWords: string[] = []
    const reviewCount = Math.floor(count * 0.7)
    const newCount = count - reviewCount

    // Add review words
    for (let i = 0; i < reviewCount && i < reviewWords.length; i++) {
      selectedWords.push(reviewWords[i])
    }

    // Add new words
    for (let i = 0; i < newCount && i < newWords.length; i++) {
      selectedWords.push(newWords[i])
    }

    // Fill remaining slots if needed
    while (selectedWords.length < count && levelWords.length > 0) {
      const randomWord = levelWords[Math.floor(Math.random() * levelWords.length)]
      if (!selectedWords.includes(randomWord)) {
        selectedWords.push(randomWord)
      }
    }

    return selectedWords.slice(0, count)
  }

  private getWordsNeedingReview(level: number): string[] {
    const now = new Date()
    const reviewWords: string[] = []

    for (const [word, data] of this.playerWordHistory) {
      if (data.level === level && data.nextReview <= now) {
        reviewWords.push(word)
      }
    }

    // Sort by most urgent review first
    reviewWords.sort((a, b) => {
      const dataA = this.playerWordHistory.get(a)!
      const dataB = this.playerWordHistory.get(b)!
      return dataA.nextReview.getTime() - dataB.nextReview.getTime()
    })

    return reviewWords
  }

  private getNewWords(_level: number, levelWords: string[]): string[] {
    return levelWords.filter(word => !this.playerWordHistory.has(word))
  }

  // Record player's performance for spaced repetition algorithm
  public recordWordAttempt(word: string, level: number, success: boolean, responseTime: number): void {
    const now = new Date()

    if (!this.playerWordHistory.has(word)) {
      this.playerWordHistory.set(word, {
        word,
        level,
        attempts: 0,
        successes: 0,
        lastSeen: now,
        nextReview: now,
        easeFactor: 2.5,
        interval: 1
      })
    }

    const data = this.playerWordHistory.get(word)!
    data.attempts++
    data.lastSeen = now

    if (success) {
      data.successes++
    }

    // Apply spaced repetition algorithm (SM-2)
    this.updateSpacedRepetition(data, success, responseTime)
  }

  private updateSpacedRepetition(data: WordData, success: boolean, responseTime: number): void {
    // Calculate quality based on success and response time
    let quality = 0
    if (success) {
      // Base quality of 3 for success, adjust based on response time
      quality = 3
      if (responseTime < 2000) quality = 5      // Very fast
      else if (responseTime < 3000) quality = 4 // Fast
      // else quality = 3 (normal)
    } else {
      quality = responseTime < 5000 ? 1 : 0 // Attempted vs timeout
    }

    // SM-2 Algorithm
    if (quality < 3) {
      // Reset interval for poor performance
      data.interval = 1
      data.nextReview = new Date(Date.now() + data.interval * 60000) // 1 minute
    } else {
      if (data.successes === 1) {
        data.interval = 1
      } else if (data.successes === 2) {
        data.interval = 6
      } else {
        data.interval = Math.round(data.interval * data.easeFactor)
      }

      // Update ease factor
      data.easeFactor = Math.max(1.3,
        data.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      )

      // Set next review time (convert interval from days to milliseconds)
      data.nextReview = new Date(Date.now() + data.interval * 24 * 60 * 60 * 1000)
    }
  }

  // Select a single word for a given level
  public selectWordForLevel(level: number): WordData | null {
    const levelWords = this.wordsByLevel.get(level) || this.getFallbackWords(level)
    if (levelWords.length === 0) return null

    // Pick a random word for now
    const word = levelWords[Math.floor(Math.random() * levelWords.length)]

    // Get or create word data
    if (!this.playerWordHistory.has(word)) {
      this.playerWordHistory.set(word, {
        word,
        level,
        attempts: 0,
        successes: 0,
        lastSeen: new Date(),
        nextReview: new Date(),
        easeFactor: 2.5,
        interval: 1
      })
    }

    return this.playerWordHistory.get(word)!
  }

  // Get player's mastery statistics
  public getPlayerStats(level?: number): {
    totalWords: number
    masteredWords: number
    accuracy: number
    averageResponseTime: number
  } {
    let totalWords = 0
    let masteredWords = 0
    let totalAttempts = 0
    let totalSuccesses = 0
    let totalResponseTime = 0

    for (const [, data] of this.playerWordHistory) {
      if (level === undefined || data.level === level) {
        totalWords++
        totalAttempts += data.attempts
        totalSuccesses += data.successes

        // Consider word mastered if success rate > 80% and seen multiple times
        if (data.attempts >= 3 && (data.successes / data.attempts) > 0.8) {
          masteredWords++
        }
      }
    }

    return {
      totalWords,
      masteredWords,
      accuracy: totalAttempts > 0 ? totalSuccesses / totalAttempts : 0,
      averageResponseTime: totalWords > 0 ? totalResponseTime / totalWords : 0
    }
  }

  // Determine if player is ready for next level
  public isReadyForNextLevel(currentLevel: number): boolean {
    const stats = this.getPlayerStats(currentLevel)
    const masteryThreshold = 0.75 // 75% of words mastered
    const accuracyThreshold = 0.8  // 80% accuracy

    return stats.totalWords > 10 &&
           (stats.masteredWords / stats.totalWords) >= masteryThreshold &&
           stats.accuracy >= accuracyThreshold
  }

  // Save/load progress to localStorage
  public saveProgress(): void {
    const data = {
      wordHistory: Array.from(this.playerWordHistory.entries()).map(([word, data]) => ({
        word,
        data: {
          ...data,
          lastSeen: data.lastSeen.toISOString(),
          nextReview: data.nextReview.toISOString()
        }
      }))
    }

    localStorage.setItem('spellspeakers_word_progress', JSON.stringify(data))
  }

  public loadProgress(): void {
    const saved = localStorage.getItem('spellspeakers_word_progress')
    if (!saved) return

    try {
      const data = JSON.parse(saved)
      this.playerWordHistory.clear()

      for (const entry of data.wordHistory) {
        this.playerWordHistory.set(entry.word, {
          ...entry.data,
          lastSeen: new Date(entry.data.lastSeen),
          nextReview: new Date(entry.data.nextReview)
        })
      }
    } catch (error) {
      console.error('Failed to load word progress:', error)
    }
  }
}