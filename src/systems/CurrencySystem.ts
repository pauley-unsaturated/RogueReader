export interface GoldWord {
  word: string
  value: number
  readingLevel: number
  complexity: 'simple' | 'medium' | 'complex'
}

export interface CurrencyTransaction {
  type: 'earn' | 'spend'
  amount: number
  source: string // e.g., "goblin defeat", "apple purchase"
  timestamp: number
}

export class CurrencySystem {
  private goldWords: number = 0
  private transactionHistory: CurrencyTransaction[] = []
  private readonly MAX_HISTORY = 50 // Keep last 50 transactions

  /**
   * Calculate gold word value based on word complexity and reading level
   */
  static calculateWordValue(word: string, readingLevel: number, complexity: 'simple' | 'medium' | 'complex'): number {
    let baseValue = 1

    // Base value by complexity
    switch (complexity) {
      case 'simple':
        baseValue = 2
        break
      case 'medium':
        baseValue = 4
        break
      case 'complex':
        baseValue = 7
        break
    }

    // Bonus for reading level (higher grade = more valuable)
    const levelBonus = Math.floor(readingLevel * 0.5)

    // Word length bonus (longer words = more valuable)
    const lengthBonus = Math.max(0, word.length - 3) * 0.5

    return Math.floor(baseValue + levelBonus + lengthBonus)
  }

  /**
   * Generate appropriate gold words for an enemy based on floor and enemy type
   */
  static generateEnemyReward(enemyLevel: number, enemyType: string, floor: number): number {
    let baseReward = 3

    // Enemy type modifiers
    const typeMultipliers: Record<string, number> = {
      'goblin': 1.0,
      'skeleton': 1.2,
      'bat': 0.8,
      'slime': 1.1,
      'orc': 1.5,
      'demon': 2.0, // Boss enemies
    }

    const multiplier = typeMultipliers[enemyType] || 1.0

    // Floor scaling
    const floorBonus = Math.floor(floor * 1.5)

    // Enemy level scaling
    const levelBonus = Math.floor(enemyLevel * 2)

    // Add some randomness (±25%)
    const variance = 0.75 + (Math.random() * 0.5)

    const totalReward = Math.floor((baseReward + floorBonus + levelBonus) * multiplier * variance)

    return Math.max(1, totalReward) // Minimum 1 gold word
  }

  /**
   * Add gold words to player's currency
   */
  addGoldWords(amount: number, source: string = 'unknown'): void {
    if (amount <= 0) return

    this.goldWords += amount
    this.recordTransaction('earn', amount, source)

    console.log(`💰 Earned ${amount} gold words from ${source} (total: ${this.goldWords})`)
  }

  /**
   * Spend gold words if player has enough
   */
  spendGoldWords(amount: number, source: string = 'purchase'): boolean {
    if (amount <= 0) return true
    if (this.goldWords < amount) {
      console.log(`❌ Not enough gold words! Need ${amount}, have ${this.goldWords}`)
      return false
    }

    this.goldWords -= amount
    this.recordTransaction('spend', amount, source)

    console.log(`💸 Spent ${amount} gold words on ${source} (remaining: ${this.goldWords})`)
    return true
  }

  /**
   * Check if player can afford a purchase
   */
  canAfford(amount: number): boolean {
    return this.goldWords >= amount
  }

  /**
   * Get current gold word balance
   */
  getBalance(): number {
    return this.goldWords
  }

  /**
   * Get recent transaction history for UI display
   */
  getRecentTransactions(count: number = 10): CurrencyTransaction[] {
    return this.transactionHistory.slice(-count).reverse()
  }

  /**
   * Get total earned and spent for statistics
   */
  getStatistics(): { totalEarned: number, totalSpent: number, netWorth: number } {
    let totalEarned = 0
    let totalSpent = 0

    this.transactionHistory.forEach(transaction => {
      if (transaction.type === 'earn') {
        totalEarned += transaction.amount
      } else {
        totalSpent += transaction.amount
      }
    })

    return {
      totalEarned,
      totalSpent,
      netWorth: this.goldWords
    }
  }

  /**
   * Save currency data to localStorage
   */
  save(): void {
    const saveData = {
      goldWords: this.goldWords,
      transactionHistory: this.transactionHistory
    }

    localStorage.setItem('roguereader_currency', JSON.stringify(saveData))
  }

  /**
   * Load currency data from localStorage
   */
  load(): void {
    try {
      const saveData = localStorage.getItem('roguereader_currency')
      if (saveData) {
        const parsed = JSON.parse(saveData)
        this.goldWords = parsed.goldWords || 0
        this.transactionHistory = parsed.transactionHistory || []

        console.log(`💾 Loaded currency: ${this.goldWords} gold words`)
      }
    } catch (error) {
      console.warn('Failed to load currency data:', error)
      // Reset to defaults
      this.goldWords = 0
      this.transactionHistory = []
    }
  }

  /**
   * Reset currency (for new game)
   */
  reset(): void {
    this.goldWords = 0
    this.transactionHistory = []
    console.log('🔄 Currency reset')
  }

  private recordTransaction(type: 'earn' | 'spend', amount: number, source: string): void {
    const transaction: CurrencyTransaction = {
      type,
      amount,
      source,
      timestamp: Date.now()
    }

    this.transactionHistory.push(transaction)

    // Keep history manageable
    if (this.transactionHistory.length > this.MAX_HISTORY) {
      this.transactionHistory.shift()
    }
  }
}

// Predefined word values for common enemy drops (can be expanded)
export const WORD_VALUES: Record<string, GoldWord> = {
  // Simple words (K-2 grade level)
  'cat': { word: 'cat', value: 2, readingLevel: 1, complexity: 'simple' },
  'dog': { word: 'dog', value: 2, readingLevel: 1, complexity: 'simple' },
  'run': { word: 'run', value: 2, readingLevel: 1, complexity: 'simple' },
  'jump': { word: 'jump', value: 3, readingLevel: 2, complexity: 'simple' },
  'book': { word: 'book', value: 3, readingLevel: 2, complexity: 'simple' },

  // Medium words (3-4 grade level)
  'dragon': { word: 'dragon', value: 5, readingLevel: 3, complexity: 'medium' },
  'castle': { word: 'castle', value: 5, readingLevel: 3, complexity: 'medium' },
  'magic': { word: 'magic', value: 4, readingLevel: 3, complexity: 'medium' },
  'brave': { word: 'brave', value: 4, readingLevel: 3, complexity: 'medium' },
  'explore': { word: 'explore', value: 6, readingLevel: 4, complexity: 'medium' },

  // Complex words (5+ grade level)
  'adventure': { word: 'adventure', value: 8, readingLevel: 5, complexity: 'complex' },
  'mysterious': { word: 'mysterious', value: 10, readingLevel: 6, complexity: 'complex' },
  'treasure': { word: 'treasure', value: 7, readingLevel: 5, complexity: 'complex' },
  'dangerous': { word: 'dangerous', value: 9, readingLevel: 6, complexity: 'complex' },
  'powerful': { word: 'powerful', value: 8, readingLevel: 5, complexity: 'complex' }
}