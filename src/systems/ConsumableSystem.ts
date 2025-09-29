export enum ConsumableType {
  FOOD = 'food',
  POTION = 'potion',
  FAIRY = 'fairy'
}

export interface ConsumableTemplate {
  id: string
  name: string
  type: ConsumableType
  healAmount: number
  rarity: 'common' | 'rare' | 'epic'
  readingLevel: number // K-12 grade level for the word
  description: string
  useText: string // What the player reads to use it
}

export interface PlayerConsumable {
  templateId: string
  quantity: number
}

// Predefined consumable templates for early game
export const BASIC_CONSUMABLE_TEMPLATES: ConsumableTemplate[] = [
  // FOOD ITEMS (Common, small healing)
  {
    id: 'apple',
    name: 'Apple',
    type: ConsumableType.FOOD,
    healAmount: 10,
    rarity: 'common',
    readingLevel: 1,
    description: 'A fresh red apple',
    useText: 'eat apple'
  },
  {
    id: 'bread',
    name: 'Bread',
    type: ConsumableType.FOOD,
    healAmount: 15,
    rarity: 'common',
    readingLevel: 2,
    description: 'A warm loaf of bread',
    useText: 'eat bread'
  },
  {
    id: 'cheese',
    name: 'Cheese',
    type: ConsumableType.FOOD,
    healAmount: 12,
    rarity: 'common',
    readingLevel: 2,
    description: 'A chunk of yellow cheese',
    useText: 'eat cheese'
  },

  // POTIONS (Rare, medium healing)
  {
    id: 'red_potion',
    name: 'Red Potion',
    type: ConsumableType.POTION,
    healAmount: 25,
    rarity: 'rare',
    readingLevel: 3,
    description: 'A glowing red healing potion',
    useText: 'drink potion'
  },
  {
    id: 'blue_potion',
    name: 'Blue Potion',
    type: ConsumableType.POTION,
    healAmount: 30,
    rarity: 'rare',
    readingLevel: 3,
    description: 'A sparkling blue mana potion',
    useText: 'drink potion'
  },

  // FAIRIES (Epic, large healing)
  {
    id: 'heal_fairy',
    name: 'Healing Fairy',
    type: ConsumableType.FAIRY,
    healAmount: 50,
    rarity: 'epic',
    readingLevel: 4,
    description: 'A magical fairy that restores health',
    useText: 'call fairy'
  }
]

export class ConsumableSystem {
  private playerConsumables: PlayerConsumable[] = []
  private maxInventorySlots: number = 8 // Limited inventory to create choices

  /**
   * Add consumable to player inventory
   */
  addConsumable(templateId: string, quantity: number = 1): boolean {
    const template = this.getConsumableTemplate(templateId)
    if (!template) {
      console.warn(`Unknown consumable template: ${templateId}`)
      return false
    }

    // Check if player already has this item
    const existing = this.playerConsumables.find(item => item.templateId === templateId)

    if (existing) {
      existing.quantity += quantity
      console.log(`📦 Found ${template.name} x${quantity} (total: ${existing.quantity})`)
    } else {
      // Check inventory space
      if (this.playerConsumables.length >= this.maxInventorySlots) {
        console.log(`🎒 Inventory full! Cannot pick up ${template.name}`)
        return false
      }

      this.playerConsumables.push({
        templateId,
        quantity
      })
      console.log(`✨ Found ${template.name} x${quantity}`)
    }

    return true
  }

  /**
   * Use a consumable item (requires reading the use text)
   */
  useConsumable(templateId: string, onSuccess: (healAmount: number) => void): boolean {
    const item = this.playerConsumables.find(item => item.templateId === templateId)
    const template = this.getConsumableTemplate(templateId)

    if (!item || !template || item.quantity <= 0) {
      console.log(`❌ No ${template?.name || templateId} to use`)
      return false
    }

    // Decrease quantity
    item.quantity--
    if (item.quantity <= 0) {
      // Remove from inventory
      const index = this.playerConsumables.indexOf(item)
      this.playerConsumables.splice(index, 1)
    }

    // Apply healing effect
    onSuccess(template.healAmount)
    console.log(`💚 Used ${template.name}, healed ${template.healAmount} HP`)

    return true
  }

  /**
   * Generate random consumable drop based on rarity and current floor
   */
  generateRandomConsumable(floor: number): string | null {
    // Adjust drop rates based on floor (harder = better drops)
    const baseRoll = Math.random()
    let roll = baseRoll

    // Increase rare/epic chances on higher floors
    if (floor >= 3) roll *= 0.8  // 20% better rolls
    if (floor >= 5) roll *= 0.8  // 36% better rolls total

    let rarityFilter: 'common' | 'rare' | 'epic'

    if (roll < 0.05) {
      rarityFilter = 'epic'
    } else if (roll < 0.25) {
      rarityFilter = 'rare'
    } else if (roll < 0.70) { // 70% chance, but some floors have no drops
      rarityFilter = 'common'
    } else {
      return null // No drop (30% chance)
    }

    const availableItems = BASIC_CONSUMABLE_TEMPLATES.filter(
      template => template.rarity === rarityFilter
    )

    if (availableItems.length === 0) {
      return null
    }

    return availableItems[Math.floor(Math.random() * availableItems.length)].id
  }

  /**
   * Get consumable for reading practice (shows use text)
   */
  getConsumableUseText(templateId: string): string | null {
    const template = this.getConsumableTemplate(templateId)
    return template?.useText || null
  }

  /**
   * Check if player has any healing items
   */
  hasHealingItems(): boolean {
    return this.playerConsumables.some(item => item.quantity > 0)
  }

  /**
   * Get all consumables player can use
   */
  getUsableConsumables(): Array<{ template: ConsumableTemplate, quantity: number }> {
    return this.playerConsumables
      .filter(item => item.quantity > 0)
      .map(item => ({
        template: this.getConsumableTemplate(item.templateId)!,
        quantity: item.quantity
      }))
  }

  private getConsumableTemplate(templateId: string): ConsumableTemplate | undefined {
    return BASIC_CONSUMABLE_TEMPLATES.find(template => template.id === templateId)
  }

  // Getters for UI
  getPlayerConsumables(): PlayerConsumable[] {
    return [...this.playerConsumables]
  }

  getConsumableTemplates(): ConsumableTemplate[] {
    return BASIC_CONSUMABLE_TEMPLATES
  }

  getInventorySpace(): { used: number, max: number } {
    return {
      used: this.playerConsumables.length,
      max: this.maxInventorySlots
    }
  }
}