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
  // Track words used in current session to prevent repeats
  private currentSessionUsedWords: Set<string> = new Set()
  private currentSessionWordPool: string[] = []

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

  /**
   * Reset session word pool - call this when starting new combat or floor
   * to ensure fresh word selection without repeats
   */
  public resetSessionWordPool(playerLevel: number): void {
    this.currentSessionUsedWords.clear()
    const level = Math.min(playerLevel, 20)
    const levelWords = this.wordsByLevel.get(level) || this.getFallbackWords(level)

    // Create shuffled pool of all available words for this level
    this.currentSessionWordPool = this.shuffleArray([...levelWords])
    console.log(`📚 Reset word pool with ${this.currentSessionWordPool.length} words for level ${level}`)
  }

  /**
   * Reset session word pool for a specific floor (Item #11)
   * Handles transition levels by mixing two word difficulty levels
   *
   * @param floor - Current dungeon floor (1-40)
   */
  public async resetSessionWordPoolForFloor(floor: number): Promise<void> {
    // Dynamic import to avoid circular dependency
    const { ProgressionSystem } = await import('@/systems/ProgressionSystem')

    this.currentSessionUsedWords.clear()

    // Check if this floor is a transition level
    const transitionMix = ProgressionSystem.getTransitionMix(floor)

    if (transitionMix) {
      // Transition level: Mix two difficulty levels
      const { currentLevel, nextLevel, ratio } = transitionMix

      // Load words for both levels
      await this.loadWordsForLevel(currentLevel)
      await this.loadWordsForLevel(nextLevel)

      const currentWords = this.wordsByLevel.get(currentLevel) || this.getFallbackWords(currentLevel)
      const nextWords = this.wordsByLevel.get(nextLevel) || this.getFallbackWords(nextLevel)

      // Calculate how many words to take from each level
      const totalCount = currentWords.length + nextWords.length
      const nextCount = Math.round(totalCount * ratio)
      const currentCount = totalCount - nextCount

      // Sample words from each level
      const currentSample = this.shuffleArray([...currentWords]).slice(0, currentCount)
      const nextSample = this.shuffleArray([...nextWords]).slice(0, nextCount)

      // Combine and shuffle
      this.currentSessionWordPool = this.shuffleArray([...currentSample, ...nextSample])

      console.log(`📚 Transition floor ${floor}: Mixed ${currentSample.length} L${currentLevel} words + ${nextSample.length} L${nextLevel} words (${Math.round(ratio * 100)}% from next level)`)
    } else {
      // Pure level: Use single difficulty
      const level = ProgressionSystem.getWordLevelForFloor(floor)
      await this.loadWordsForLevel(level)

      const levelWords = this.wordsByLevel.get(level) || this.getFallbackWords(level)
      this.currentSessionWordPool = this.shuffleArray([...levelWords])

      console.log(`📚 Pure floor ${floor}: Reset word pool with ${this.currentSessionWordPool.length} words for level ${level}`)
    }
  }

  /**
   * Fisher-Yates shuffle for unbiased randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Mark word as used in current session
   */
  public markWordAsUsed(word: string): void {
    this.currentSessionUsedWords.add(word)
  }

  // Get appropriate words based on player's reading level and spaced repetition
  public async getWordsForSpell(playerLevel: number, _spellType: 'attack' | 'defense' | 'unlock' | 'heal', count: number = 1): Promise<string[]> {
    const level = Math.min(playerLevel, 20)
    await this.loadWordsForLevel(level)

    // Ensure session pool is initialized
    if (this.currentSessionWordPool.length === 0) {
      this.resetSessionWordPool(playerLevel)
    }

    const selectedWords: string[] = []

    // Sample without replacement from the session pool
    let attempts = 0
    const maxAttempts = this.currentSessionWordPool.length * 2 // Safety limit

    while (selectedWords.length < count && attempts < maxAttempts) {
      attempts++

      // If we've exhausted the pool, refill it
      if (this.currentSessionWordPool.length === 0) {
        console.log('🔄 Word pool exhausted, refilling with shuffled words')
        this.resetSessionWordPool(playerLevel)
      }

      // Take word from pool
      const word = this.currentSessionWordPool.pop()!

      // Only add if not already used in this session
      if (!this.currentSessionUsedWords.has(word) && !selectedWords.includes(word)) {
        selectedWords.push(word)
        this.currentSessionUsedWords.add(word)
      }
    }

    console.log(`🎯 Selected ${selectedWords.length} unique words: ${selectedWords.join(', ')}`)
    return selectedWords.slice(0, count)
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

  /**
   * Select word for boss encounters - mixes current and next level words
   * 70% from current level, 30% from next level for increased challenge
   */
  public selectWordForBoss(currentLevel: number): WordData | null {
    const useNextLevel = Math.random() < 0.3  // 30% chance for next level word

    if (useNextLevel && currentLevel < 20) {
      // Select from next level (30% chance)
      const nextLevel = currentLevel + 1
      console.log(`👑 Boss word: Using NEXT level (${nextLevel}) for extra challenge!`)
      return this.selectWordForLevel(nextLevel)
    } else {
      // Select from current level (70% chance)
      console.log(`👑 Boss word: Using current level (${currentLevel})`)
      return this.selectWordForLevel(currentLevel)
    }
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