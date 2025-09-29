export enum RuneType {
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  CORE = 'core'
}

export enum RuneRarity {
  COMMON = 'common',    // 70% drop rate, +10% base effect
  RARE = 'rare',        // 25% drop rate, +20% base effect
  EPIC = 'epic',        // 5% drop rate,  +35% base effect
}

export interface RuneEffect {
  type: 'damage' | 'healing' | 'shield' | 'area' | 'speed' | 'chain'
  value: number
  description: string
}

export interface RuneTemplate {
  id: string
  name: string // The word that gets read (e.g., "Flame", "Blast", "Echo")
  type: RuneType
  rarity: RuneRarity
  baseEffect: RuneEffect
  maxLevel: number
  readingLevel: number // K-12 grade level for the word
}

export interface PlayerRune {
  templateId: string
  level: number // 1-5, stacks for increased effect
  timesRead: number // Track how often player has read this rune
  lastCharged: number // Timestamp of last reading (for charging mechanic)
}

export interface RuneSlots {
  prefix: PlayerRune | null
  suffix: PlayerRune | null
  core: PlayerRune | null
}

// Predefined rune templates for early game (K-3 reading level)
export const BASIC_RUNE_TEMPLATES: RuneTemplate[] = [
  // PREFIX RUNES (modify spell start)
  {
    id: 'prefix_flame',
    name: 'Flame',
    type: RuneType.PREFIX,
    rarity: RuneRarity.COMMON,
    baseEffect: {
      type: 'damage',
      value: 0.25, // +25% fire damage
      description: 'Adds fire damage to spells'
    },
    maxLevel: 5,
    readingLevel: 2
  },
  {
    id: 'prefix_ice',
    name: 'Ice',
    type: RuneType.PREFIX,
    rarity: RuneRarity.COMMON,
    baseEffect: {
      type: 'speed',
      value: 0.15, // +15% spell speed (faster casting)
      description: 'Makes spells cast faster'
    },
    maxLevel: 5,
    readingLevel: 1
  },
  {
    id: 'prefix_big',
    name: 'Big',
    type: RuneType.PREFIX,
    rarity: RuneRarity.RARE,
    baseEffect: {
      type: 'damage',
      value: 0.4, // +40% damage
      description: 'Makes spells much stronger'
    },
    maxLevel: 3,
    readingLevel: 1
  },

  // SUFFIX RUNES (modify spell end)
  {
    id: 'suffix_blast',
    name: 'Blast',
    type: RuneType.SUFFIX,
    rarity: RuneRarity.COMMON,
    baseEffect: {
      type: 'area',
      value: 1, // Hits 1 extra nearby enemy
      description: 'Spell hits nearby enemies too'
    },
    maxLevel: 3,
    readingLevel: 2
  },
  {
    id: 'suffix_heal',
    name: 'Heal',
    type: RuneType.SUFFIX,
    rarity: RuneRarity.RARE,
    baseEffect: {
      type: 'healing',
      value: 5, // Heal 5 HP per cast
      description: 'Spell heals you when cast'
    },
    maxLevel: 4,
    readingLevel: 2
  },
  {
    id: 'suffix_shield',
    name: 'Shield',
    type: RuneType.SUFFIX,
    rarity: RuneRarity.EPIC,
    baseEffect: {
      type: 'shield',
      value: 3, // +3 temporary shield
      description: 'Spell gives you protection'
    },
    maxLevel: 3,
    readingLevel: 3
  },

  // CORE RUNES (modify base behavior)
  {
    id: 'core_echo',
    name: 'Echo',
    type: RuneType.CORE,
    rarity: RuneRarity.RARE,
    baseEffect: {
      type: 'chain',
      value: 1, // Spell repeats once
      description: 'Spell happens twice'
    },
    maxLevel: 2,
    readingLevel: 3
  },
  {
    id: 'core_power',
    name: 'Power',
    type: RuneType.CORE,
    rarity: RuneRarity.COMMON,
    baseEffect: {
      type: 'damage',
      value: 0.3, // +30% damage
      description: 'Makes all spells stronger'
    },
    maxLevel: 5,
    readingLevel: 2
  }
]

export class RuneSystem {
  private playerRunes: PlayerRune[] = []
  private equippedRunes: RuneSlots = {
    prefix: null,
    suffix: null,
    core: null
  }

  /**
   * Add a rune to player's collection, or level it up if they already have it
   */
  addRune(templateId: string): PlayerRune {
    // Check if player already has this rune
    const existingRune = this.playerRunes.find(rune => rune.templateId === templateId)
    const template = this.getRuneTemplate(templateId)

    if (!template) {
      throw new Error(`Unknown rune template: ${templateId}`)
    }

    if (existingRune && existingRune.level < template.maxLevel) {
      // Level up existing rune
      existingRune.level++
      console.log(`📈 Rune ${template.name} leveled up to ${existingRune.level}!`)
      return existingRune
    } else if (!existingRune) {
      // Create new rune
      const newRune: PlayerRune = {
        templateId,
        level: 1,
        timesRead: 0,
        lastCharged: Date.now()
      }
      this.playerRunes.push(newRune)
      console.log(`✨ New rune acquired: ${template.name} I`)
      return newRune
    } else {
      // Already at max level - could convert to currency later
      console.log(`🔥 ${template.name} is already at max level ${template.maxLevel}!`)
      return existingRune
    }
  }

  /**
   * Equip a rune to the appropriate slot
   */
  equipRune(templateId: string): boolean {
    const rune = this.playerRunes.find(r => r.templateId === templateId)
    const template = this.getRuneTemplate(templateId)

    if (!rune || !template) {
      console.warn(`Cannot equip rune: ${templateId}`)
      return false
    }

    // Unequip any existing rune in this slot
    this.equippedRunes[template.type] = rune
    console.log(`⚡ Equipped ${template.name} ${this.getRomanNumeral(rune.level)} (${template.type})`)
    return true
  }

  /**
   * Get the current damage multiplier from equipped runes
   */
  getDamageMultiplier(): number {
    let multiplier = 1.0

    Object.values(this.equippedRunes).forEach(rune => {
      if (!rune) return

      const template = this.getRuneTemplate(rune.templateId)
      if (template?.baseEffect.type === 'damage') {
        const effectValue = template.baseEffect.value * rune.level
        multiplier += effectValue
      }
    })

    return multiplier
  }

  /**
   * Get healing bonus from equipped runes
   */
  getHealingBonus(): number {
    let healing = 0

    Object.values(this.equippedRunes).forEach(rune => {
      if (!rune) return

      const template = this.getRuneTemplate(rune.templateId)
      if (template?.baseEffect.type === 'healing') {
        healing += template.baseEffect.value * rune.level
      }
    })

    return healing
  }

  /**
   * Check if spells should have area effect
   */
  hasAreaEffect(): number {
    let areaTargets = 0

    Object.values(this.equippedRunes).forEach(rune => {
      if (!rune) return

      const template = this.getRuneTemplate(rune.templateId)
      if (template?.baseEffect.type === 'area') {
        areaTargets += template.baseEffect.value * rune.level
      }
    })

    return areaTargets
  }

  /**
   * Get shield bonus from equipped runes
   */
  getShieldBonus(): number {
    let shield = 0

    Object.values(this.equippedRunes).forEach(rune => {
      if (!rune) return

      const template = this.getRuneTemplate(rune.templateId)
      if (template?.baseEffect.type === 'shield') {
        shield += template.baseEffect.value * rune.level
      }
    })

    return shield
  }

  /**
   * Check if spells should repeat (echo effect)
   */
  hasEchoEffect(): number {
    let echoes = 0

    Object.values(this.equippedRunes).forEach(rune => {
      if (!rune) return

      const template = this.getRuneTemplate(rune.templateId)
      if (template?.baseEffect.type === 'chain') {
        echoes += template.baseEffect.value * rune.level
      }
    })

    return echoes
  }

  /**
   * Generate a random rune drop based on rarity weights
   */
  generateRandomRune(): string {
    const roll = Math.random()
    let rarityFilter: RuneRarity

    if (roll < 0.05) {
      rarityFilter = RuneRarity.EPIC
    } else if (roll < 0.30) {
      rarityFilter = RuneRarity.RARE
    } else {
      rarityFilter = RuneRarity.COMMON
    }

    const availableRunes = BASIC_RUNE_TEMPLATES.filter(
      template => template.rarity === rarityFilter
    )

    if (availableRunes.length === 0) {
      // Fallback to common runes
      const commonRunes = BASIC_RUNE_TEMPLATES.filter(
        template => template.rarity === RuneRarity.COMMON
      )
      return commonRunes[Math.floor(Math.random() * commonRunes.length)].id
    }

    return availableRunes[Math.floor(Math.random() * availableRunes.length)].id
  }

  private getRuneTemplate(templateId: string): RuneTemplate | undefined {
    return BASIC_RUNE_TEMPLATES.find(template => template.id === templateId)
  }

  private getRomanNumeral(level: number): string {
    const romans = ['', 'I', 'II', 'III', 'IV', 'V']
    return romans[level] || level.toString()
  }

  // Getters for UI
  getPlayerRunes(): PlayerRune[] {
    return [...this.playerRunes]
  }

  getEquippedRunes(): RuneSlots {
    return { ...this.equippedRunes }
  }

  getRuneTemplates(): RuneTemplate[] {
    return BASIC_RUNE_TEMPLATES
  }
}