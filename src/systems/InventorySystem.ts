import { ConsumableSystem, PlayerConsumable, ConsumableTemplate } from './ConsumableSystem'
import { RuneSystem, PlayerRune, RuneSlots, RuneTemplate } from './RuneSystem'

export interface HotBarSlot {
  slotIndex: number // 0-3 for slots 1-4
  consumableId: string | null
  quantity: number
}

export interface InventoryState {
  consumables: PlayerConsumable[]
  runes: PlayerRune[]
  equippedRunes: RuneSlots
  hotBar: HotBarSlot[]
  goldWords: number
}

export class InventorySystem {
  private consumableSystem: ConsumableSystem
  private runeSystem: RuneSystem
  private hotBar: HotBarSlot[] = []

  constructor() {
    this.consumableSystem = new ConsumableSystem()
    this.runeSystem = new RuneSystem()
    this.initializeHotBar()
  }

  private initializeHotBar(): void {
    // Initialize 4 empty hot bar slots
    this.hotBar = [
      { slotIndex: 0, consumableId: null, quantity: 0 },
      { slotIndex: 1, consumableId: null, quantity: 0 },
      { slotIndex: 2, consumableId: null, quantity: 0 },
      { slotIndex: 3, consumableId: null, quantity: 0 }
    ]
  }

  /**
   * Add consumable and auto-equip to hot bar if it's a new type
   */
  addConsumable(templateId: string, quantity: number = 1): boolean {
    const success = this.consumableSystem.addConsumable(templateId, quantity)

    if (success) {
      this.autoEquipConsumable(templateId)
      this.refreshHotBar()
    }

    return success
  }

  /**
   * Auto-equip new consumable types to empty hot bar slots
   */
  private autoEquipConsumable(templateId: string): void {
    // Check if this consumable type is already on the hot bar
    const alreadyEquipped = this.hotBar.some(slot => slot.consumableId === templateId)

    if (alreadyEquipped) {
      return // Already have this type equipped
    }

    // Find first empty slot
    const emptySlot = this.hotBar.find(slot => slot.consumableId === null)

    if (emptySlot) {
      emptySlot.consumableId = templateId
      console.log(`🎯 Auto-equipped ${templateId} to hot bar slot ${emptySlot.slotIndex + 1}`)
    }
  }

  /**
   * Manually assign consumable to specific hot bar slot (from inventory UI)
   */
  assignToHotBar(templateId: string, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 4) {
      console.warn(`Invalid hot bar slot: ${slotIndex}`)
      return false
    }

    // Check if player has this consumable
    const playerConsumable = this.consumableSystem.getPlayerConsumables()
      .find(item => item.templateId === templateId)

    if (!playerConsumable || playerConsumable.quantity <= 0) {
      console.warn(`Cannot assign ${templateId} to hot bar - not in inventory`)
      return false
    }

    this.hotBar[slotIndex].consumableId = templateId
    this.refreshHotBar()

    console.log(`🎯 Assigned ${templateId} to hot bar slot ${slotIndex + 1}`)
    return true
  }

  /**
   * Use consumable from hot bar slot (called when player presses 1-4)
   */
  useHotBarSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= 4) {
      console.warn(`Invalid hot bar slot: ${slotIndex}`)
      return false
    }

    const slot = this.hotBar[slotIndex]
    if (!slot.consumableId || slot.quantity <= 0) {
      console.log(`❌ Hot bar slot ${slotIndex + 1} is empty`)
      return false
    }

    // Use the consumable
    const success = this.consumableSystem.useConsumable(slot.consumableId, (healAmount) => {
      // This callback will be called by the GameScene to apply healing
      console.log(`💚 Hot bar healing: ${healAmount} HP`)
    })

    if (success) {
      this.refreshHotBar()
      console.log(`✅ Used item from hot bar slot ${slotIndex + 1}`)
    }

    return success
  }

  /**
   * Refresh hot bar quantities and clear empty slots
   */
  private refreshHotBar(): void {
    const playerConsumables = this.consumableSystem.getPlayerConsumables()

    this.hotBar.forEach(slot => {
      if (slot.consumableId) {
        const consumable = playerConsumables.find(item => item.templateId === slot.consumableId)

        if (consumable && consumable.quantity > 0) {
          slot.quantity = consumable.quantity
        } else {
          // Item no longer available, clear slot
          slot.consumableId = null
          slot.quantity = 0
        }
      }
    })

    // Auto-fill empty slots with available consumables
    this.autoFillEmptySlots()
  }

  /**
   * Auto-fill empty hot bar slots with available consumables
   */
  private autoFillEmptySlots(): void {
    const playerConsumables = this.consumableSystem.getPlayerConsumables()
    const equippedIds = this.hotBar
      .filter(slot => slot.consumableId !== null)
      .map(slot => slot.consumableId)

    // Find consumables not yet on hot bar
    const unequippedConsumables = playerConsumables.filter(item =>
      item.quantity > 0 && !equippedIds.includes(item.templateId)
    )

    // Fill empty slots
    this.hotBar.forEach(slot => {
      if (slot.consumableId === null && unequippedConsumables.length > 0) {
        const nextConsumable = unequippedConsumables.shift()!
        slot.consumableId = nextConsumable.templateId
        slot.quantity = nextConsumable.quantity
      }
    })
  }

  /**
   * Add rune to collection
   */
  addRune(templateId: string): PlayerRune {
    return this.runeSystem.addRune(templateId)
  }

  /**
   * Equip rune to appropriate slot
   */
  equipRune(templateId: string): boolean {
    return this.runeSystem.equipRune(templateId)
  }

  /**
   * Get hot bar data for UI display
   */
  getHotBar(): Array<{ slotIndex: number, template: ConsumableTemplate | null, quantity: number }> {
    const templates = this.consumableSystem.getConsumableTemplates()

    return this.hotBar.map(slot => ({
      slotIndex: slot.slotIndex,
      template: slot.consumableId ?
        templates.find(t => t.id === slot.consumableId) || null : null,
      quantity: slot.quantity
    }))
  }

  /**
   * Get all consumables for inventory UI
   */
  getAllConsumables(): Array<{ template: ConsumableTemplate, quantity: number }> {
    return this.consumableSystem.getUsableConsumables()
  }

  /**
   * Get all runes for inventory UI
   */
  getAllRunes(): Array<{ template: RuneTemplate, rune: PlayerRune }> {
    const templates = this.runeSystem.getRuneTemplates()
    const playerRunes = this.runeSystem.getPlayerRunes()

    return playerRunes.map(rune => ({
      template: templates.find(t => t.id === rune.templateId)!,
      rune
    }))
  }

  /**
   * Get equipped runes
   */
  getEquippedRunes(): RuneSlots {
    return this.runeSystem.getEquippedRunes()
  }

  /**
   * Get rune system for combat calculations
   */
  getRuneSystem(): RuneSystem {
    return this.runeSystem
  }

  /**
   * Get consumable system for shop integration
   */
  getConsumableSystem(): ConsumableSystem {
    return this.consumableSystem
  }

  /**
   * Get current inventory state for saving
   */
  getInventoryState(): InventoryState {
    return {
      consumables: this.consumableSystem.getPlayerConsumables(),
      runes: this.runeSystem.getPlayerRunes(),
      equippedRunes: this.runeSystem.getEquippedRunes(),
      hotBar: [...this.hotBar],
      goldWords: 0 // Will be set by CurrencySystem
    }
  }

  /**
   * Save inventory data
   */
  save(): void {
    const saveData = this.getInventoryState()
    localStorage.setItem('roguereader_inventory', JSON.stringify(saveData))
  }

  /**
   * Load inventory data
   */
  load(): void {
    try {
      const saveData = localStorage.getItem('roguereader_inventory')
      if (saveData) {
        const parsed = JSON.parse(saveData)

        // Restore hot bar
        if (parsed.hotBar) {
          this.hotBar = parsed.hotBar
        }

        // Note: ConsumableSystem and RuneSystem have their own load methods
        console.log('💾 Loaded inventory data')
      }
    } catch (error) {
      console.warn('Failed to load inventory data:', error)
      this.initializeHotBar()
    }
  }

  /**
   * Reset inventory (for new game)
   */
  reset(): void {
    this.initializeHotBar()
    // Note: Systems should handle their own reset
    console.log('🔄 Inventory reset')
  }
}