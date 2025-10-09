import * as Phaser from 'phaser';
import { CombatSystem, SpellCast } from '../systems/CombatSystem';

export class CombatUI extends Phaser.GameObjects.Container {
  private combatSystem: CombatSystem;
  private comboText!: Phaser.GameObjects.Text;
  private damageText!: Phaser.GameObjects.Text;
  private spellNameText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private castingWord!: Phaser.GameObjects.Text;
  private comboMeter!: Phaser.GameObjects.Graphics;
  private wordComplexityIndicator!: Phaser.GameObjects.Text;
  private microphoneIndicator!: Phaser.GameObjects.Graphics;
  private speechPrompt!: Phaser.GameObjects.Text;
  private pronunciationHelp!: Phaser.GameObjects.Text;
  private criticalHitIndicator!: Phaser.GameObjects.Text;
  private countdownBar!: Phaser.GameObjects.Graphics;
  private countdownTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, combatSystem: CombatSystem) {
    super(scene, x, y);
    this.combatSystem = combatSystem;

    this.createUI();
    this.setupEventListeners();
    scene.add.existing(this);
  }

  private createUI(): void {
    // Create combo display (HIDDEN - now handled by CastingDialog spell slots)
    this.comboText = this.scene.add.text(0, 0, 'COMBO: 0x', {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.comboText.setAlpha(0); // Hidden - obsolete UI
    this.add(this.comboText);

    // Create combo multiplier meter (HIDDEN - this was the "green bar bug")
    this.comboMeter = this.scene.add.graphics();
    this.comboMeter.x = 0;
    this.comboMeter.y = 35;
    this.comboMeter.setAlpha(0); // Hidden - obsolete UI, caused green bar at top
    this.add(this.comboMeter);

    // Create damage display
    this.damageText = this.scene.add.text(0, 70, '', {
      fontSize: '32px',
      color: '#ff0000',
      fontFamily: 'Arial Black',
      stroke: '#ffffff',
      strokeThickness: 3
    });
    this.damageText.setOrigin(0.5);
    this.add(this.damageText);

    // Create spell name display
    this.spellNameText = this.scene.add.text(0, 110, '', {
      fontSize: '20px',
      color: '#00ffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.spellNameText.setOrigin(0.5);
    this.add(this.spellNameText);

    // Create word complexity indicator
    this.wordComplexityIndicator = this.scene.add.text(0, 140, '', {
      fontSize: '16px',
      color: '#ffa500',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.wordComplexityIndicator.setOrigin(0.5);
    this.add(this.wordComplexityIndicator);

    // Create health bar (HIDDEN - now handled by UIScene)
    this.healthBar = this.scene.add.graphics();
    this.healthBar.x = -100;
    this.healthBar.y = -50;
    this.healthBar.setAlpha(0); // Hidden - obsolete UI
    this.add(this.healthBar);

    // Create health text (HIDDEN - now handled by UIScene)
    this.healthText = this.scene.add.text(0, -50, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.healthText.setOrigin(0.5);
    this.healthText.setAlpha(0); // Hidden - obsolete UI
    this.add(this.healthText);

    // Create current casting word display (hidden - now handled by dialog)
    this.castingWord = this.scene.add.text(0, -100, '', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#000000cc',
      padding: { left: 15, right: 15, top: 10, bottom: 10 }
    });
    this.castingWord.setOrigin(0.5);
    this.castingWord.setAlpha(0); // Hidden by default
    this.add(this.castingWord);

    // Create microphone indicator
    this.microphoneIndicator = this.scene.add.graphics();
    this.microphoneIndicator.x = -150;
    this.microphoneIndicator.y = 180;
    this.add(this.microphoneIndicator);

    // Create speech prompt
    this.speechPrompt = this.scene.add.text(0, 220, 'Press SPACE to speak', {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.speechPrompt.setOrigin(0.5);
    this.speechPrompt.setAlpha(0);
    this.add(this.speechPrompt);

    // Create pronunciation help text
    this.pronunciationHelp = this.scene.add.text(0, 250, '', {
      fontSize: '16px',
      color: '#ffff00',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#000000aa',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    this.pronunciationHelp.setOrigin(0.5);
    this.pronunciationHelp.setAlpha(0);
    this.add(this.pronunciationHelp);

    // Create critical hit indicator
    this.criticalHitIndicator = this.scene.add.text(0, -20, '', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.criticalHitIndicator.setOrigin(0.5);
    this.criticalHitIndicator.setAlpha(0);
    this.add(this.criticalHitIndicator);

    // Create countdown timer bar (now handled by dialog)
    this.countdownBar = this.scene.add.graphics();
    this.countdownBar.x = -100;
    this.countdownBar.y = 200;
    this.countdownBar.setAlpha(0); // Always hidden
    this.add(this.countdownBar);

    this.updateHealthBar();
  }

  private setupEventListeners(): void {
    // Listen to combat system events
    this.combatSystem.on('spellCast', (data: any) => {
      this.showSpellEffect(data.spell, data.combo, data.multiplier);
      this.updateComboDisplay(data.combo, data.multiplier);
    });

    this.combatSystem.on('damageDealt', (data: any) => {
      this.showDamageNumber(data.damage, data.element);
    });

    this.combatSystem.on('comboLost', (data: any) => {
      this.showComboLost(data.count);
    });

    this.combatSystem.on('playerDamaged', () => {
      this.updateHealthBar();
      this.flashRed();
    });

    this.combatSystem.on('playerHealed', (data: any) => {
      this.updateHealthBar();
      this.showHealEffect(data.amount);
    });

    this.combatSystem.on('enemyDefeated', (data: any) => {
      this.showVictoryEffect(data.enemyName);
    });
  }

  private updateComboDisplay(count: number, multiplier: number): void {
    // Update combo text
    this.comboText.setText(`COMBO: ${count}x`);

    // Color code based on multiplier
    if (multiplier >= 3) {
      this.comboText.setColor('#ff00ff'); // Magenta for max combo
    } else if (multiplier >= 2.5) {
      this.comboText.setColor('#ff0000'); // Red for high combo
    } else if (multiplier >= 2) {
      this.comboText.setColor('#ffa500'); // Orange for medium combo
    } else if (multiplier >= 1.5) {
      this.comboText.setColor('#ffff00'); // Yellow for low combo
    } else {
      this.comboText.setColor('#ffffff'); // White for no combo
    }

    // Animate combo text
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });

    // Update combo meter
    this.drawComboMeter(multiplier);
  }

  private drawComboMeter(multiplier: number): void {
    this.comboMeter.clear();

    // Background
    this.comboMeter.fillStyle(0x333333);
    this.comboMeter.fillRect(0, 0, 200, 20);

    // Fill based on multiplier (max 3.0)
    const fillWidth = (multiplier / 3.0) * 200;
    let fillColor = 0x00ff00; // Green

    if (multiplier >= 2.5) fillColor = 0xff00ff; // Magenta
    else if (multiplier >= 2) fillColor = 0xff0000; // Red
    else if (multiplier >= 1.5) fillColor = 0xffa500; // Orange
    else if (multiplier > 1) fillColor = 0xffff00; // Yellow

    this.comboMeter.fillStyle(fillColor);
    this.comboMeter.fillRect(0, 0, fillWidth, 20);

    // Border
    this.comboMeter.lineStyle(2, 0xffffff);
    this.comboMeter.strokeRect(0, 0, 200, 20);
  }

  private showSpellEffect(spell: SpellCast, _combo: number, _multiplier: number): void {
    // Show spell name
    this.spellNameText.setText(spell.word.toUpperCase());

    // Show element effect
    let elementColor = '#ffffff';
    let elementEmoji = '';
    switch (spell.element) {
      case 'fire':
        elementColor = '#ff4500';
        elementEmoji = '🔥';
        break;
      case 'ice':
        elementColor = '#00bfff';
        elementEmoji = '❄️';
        break;
      case 'lightning':
        elementColor = '#ffff00';
        elementEmoji = '⚡';
        break;
      default:
        elementColor = '#ffffff';
        elementEmoji = '✨';
    }

    this.spellNameText.setColor(elementColor);
    this.spellNameText.setText(`${elementEmoji} ${spell.word.toUpperCase()} ${elementEmoji}`);

    // Animate spell name
    this.scene.tweens.add({
      targets: this.spellNameText,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.out'
    });

    // Fade out after a moment
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: this.spellNameText,
        alpha: 0,
        duration: 500
      });
    });
  }

  private showDamageNumber(damage: number, element?: string): void {
    this.damageText.setText(damage.toString());

    // Set color based on element
    let color = '#ff0000'; // Default red
    if (element === 'fire') color = '#ff4500';
    else if (element === 'ice') color = '#00bfff';
    else if (element === 'lightning') color = '#ffff00';

    this.damageText.setColor(color);

    // Animate damage number floating up
    this.damageText.setAlpha(1);
    this.damageText.y = 70;

    this.scene.tweens.add({
      targets: this.damageText,
      y: 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.out'
    });
  }

  private showComboLost(count: number): void {
    // Create temporary text for combo lost
    const lostText = this.scene.add.text(0, 50, `COMBO LOST! (${count})`, {
      fontSize: '24px',
      color: '#ff0000',
      fontFamily: 'Arial Black',
      stroke: '#ffffff',
      strokeThickness: 3
    });
    lostText.setOrigin(0.5);
    this.add(lostText);

    // Shake and fade
    this.scene.tweens.add({
      targets: lostText,
      x: { from: -5, to: 5 },
      duration: 50,
      repeat: 5,
      yoyo: true
    });

    this.scene.tweens.add({
      targets: lostText,
      alpha: 0,
      duration: 1500,
      delay: 500,
      onComplete: () => lostText.destroy()
    });

    // Reset combo display
    this.comboText.setText('COMBO: 0x');
    this.comboText.setColor('#ffffff');
    this.drawComboMeter(1);
  }

  private updateHealthBar(): void {
    const stats = this.combatSystem.getPlayerStats();
    const healthPercent = stats.health / stats.maxHealth;

    this.healthBar.clear();

    // Background
    this.healthBar.fillStyle(0x333333);
    this.healthBar.fillRect(0, 0, 200, 20);

    // Health fill
    let healthColor = 0x00ff00; // Green
    if (healthPercent <= 0.25) healthColor = 0xff0000; // Red
    else if (healthPercent <= 0.5) healthColor = 0xffff00; // Yellow

    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(0, 0, 200 * healthPercent, 20);

    // Border
    this.healthBar.lineStyle(2, 0xffffff);
    this.healthBar.strokeRect(0, 0, 200, 20);

    // Update health text
    this.healthText.setText(`HP: ${stats.health}/${stats.maxHealth}`);
  }

  private flashRed(): void {
    // Create red flash overlay
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xff0000, 0.3);
    flash.fillRect(-200, -200, 400, 400);
    this.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  private showHealEffect(amount: number): void {
    const healText = this.scene.add.text(0, 0, `+${amount} HP`, {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: 'Arial Black',
      stroke: '#ffffff',
      strokeThickness: 3
    });
    healText.setOrigin(0.5);
    this.add(healText);

    this.scene.tweens.add({
      targets: healText,
      y: -50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.out',
      onComplete: () => healText.destroy()
    });
  }

  private showVictoryEffect(enemyName: string): void {
    const victoryText = this.scene.add.text(0, 0, `${enemyName} DEFEATED!`, {
      fontSize: '28px',
      color: '#ffd700',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    });
    victoryText.setOrigin(0.5);
    this.add(victoryText);

    // Celebration animation
    this.scene.tweens.add({
      targets: victoryText,
      scaleX: { from: 0, to: 1.2 },
      scaleY: { from: 0, to: 1.2 },
      duration: 500,
      ease: 'Back.out'
    });

    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: victoryText,
        alpha: 0,
        duration: 500,
        onComplete: () => victoryText.destroy()
      });
    });
  }

  public showCastingWord(word: string): void {
    this.castingWord.setText(word);
    this.castingWord.setAlpha(1);
  }

  public hideCastingWord(): void {
    this.scene.tweens.add({
      targets: this.castingWord,
      alpha: 0,
      duration: 300
    });
  }

  public showWordComplexity(_word: string, complexity: number): void {
    const stars = '⭐'.repeat(Math.ceil(complexity));
    this.wordComplexityIndicator.setText(`Complexity: ${stars}`);

    this.scene.tweens.add({
      targets: this.wordComplexityIndicator,
      alpha: { from: 0, to: 1 },
      duration: 300
    });

    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.wordComplexityIndicator,
        alpha: 0,
        duration: 500
      });
    });
  }

  public showSpeechPrompt(): void {
    this.speechPrompt.setAlpha(1);

    // Pulsing animation
    this.scene.tweens.add({
      targets: this.speechPrompt,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public hideSpeechPrompt(): void {
    this.scene.tweens.killTweensOf(this.speechPrompt);
    this.speechPrompt.setScale(1);
    this.speechPrompt.setAlpha(0);
  }

  public showMicrophoneListening(): void {
    this.microphoneIndicator.clear();

    // Draw animated microphone
    this.microphoneIndicator.fillStyle(0xff0000);
    this.microphoneIndicator.fillCircle(0, 0, 12);

    this.microphoneIndicator.lineStyle(3, 0xffffff);
    this.microphoneIndicator.strokeCircle(0, 0, 12);

    // Pulsing animation
    this.scene.tweens.add({
      targets: this.microphoneIndicator,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public hideMicrophoneIndicator(): void {
    this.scene.tweens.killTweensOf(this.microphoneIndicator);
    this.microphoneIndicator.setScale(1);
    this.microphoneIndicator.clear();
  }

  public showPronunciationHelp(message: string): void {
    this.pronunciationHelp.setText(message);
    this.pronunciationHelp.setAlpha(1);

    // Gentle fade in/out
    this.scene.tweens.add({
      targets: this.pronunciationHelp,
      alpha: { from: 0, to: 1 },
      duration: 300
    });
  }

  public showPhoneticBreakdown(word: string, highlightedPart?: string, partIndex?: number): void {
    let displayText = word;

    if (highlightedPart && partIndex !== undefined) {
      // Create highlighted version of the word
      const parts = this.breakWordForDisplay(word);
      displayText = parts.map((part, index) => {
        if (index === partIndex) {
          return `[${part}]`; // Brackets around highlighted part
        }
        return part;
      }).join('');
    }

    this.castingWord.setText(displayText);
    this.castingWord.setColor('#ffff00'); // Bright yellow for lesson mode

    // Pulsing effect for highlighted part
    this.scene.tweens.add({
      targets: this.castingWord,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 400,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  private breakWordForDisplay(word: string): string[] {
    // Simple breakdown for display purposes
    const patterns = [
      /ch|sh|th|wh|ph/,     // digraphs
      /bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw/, // blends
      /ai|ay|ea|ee|ie|oa|oo|ou|ow/, // vowel teams
      /[a-z]/               // single letters
    ];

    const parts: string[] = [];
    let remaining = word.toLowerCase();

    while (remaining.length > 0) {
      let matched = false;

      for (const pattern of patterns) {
        const match = remaining.match(pattern);
        if (match && match.index === 0) {
          parts.push(match[0]);
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }

    return parts;
  }

  public hidePronunciationHelp(): void {
    this.scene.tweens.add({
      targets: this.pronunciationHelp,
      alpha: 0,
      duration: 500
    });
  }

  public showCriticalHit(): void {
    this.criticalHitIndicator.setText('💥 CRITICAL HIT! 💥');
    this.criticalHitIndicator.setAlpha(1);

    // Explosive animation
    this.scene.tweens.add({
      targets: this.criticalHitIndicator,
      scaleX: { from: 0, to: 1.5 },
      scaleY: { from: 0, to: 1.5 },
      duration: 300,
      ease: 'Back.out'
    });

    // Flash gold color
    const originalColor = this.criticalHitIndicator.style.color;
    this.scene.tweens.add({
      targets: this.criticalHitIndicator.style,
      duration: 150,
      repeat: 3,
      yoyo: true,
      onUpdate: () => {
        const phase = this.scene.tweens.getTweensOf(this.criticalHitIndicator.style)[0].progress;
        const color = phase > 0.5 ? '#ffffff' : '#ffd700';
        this.criticalHitIndicator.setColor(color);
      }
    });

    // Fade out after celebration
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.criticalHitIndicator,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 500,
        onComplete: () => {
          this.criticalHitIndicator.setScale(1);
          this.criticalHitIndicator.setColor(originalColor);
        }
      });
    });
  }

  public showTimeout(): void {
    const timeoutText = this.scene.add.text(0, 280, '⏰ Timeout! Try again', {
      fontSize: '20px',
      color: '#ff8800',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#000000aa',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    timeoutText.setOrigin(0.5);
    this.add(timeoutText);

    // Fade in and out
    this.scene.tweens.add({
      targets: timeoutText,
      alpha: { from: 0, to: 1 },
      duration: 300
    });

    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: timeoutText,
        alpha: 0,
        duration: 500,
        onComplete: () => timeoutText.destroy()
      });
    });
  }

  public showSpeechError(message: string): void {
    const errorText = this.scene.add.text(0, 280, `❌ ${message}`, {
      fontSize: '18px',
      color: '#ff0000',
      fontFamily: 'Arial',
      stroke: '#ffffff',
      strokeThickness: 2,
      backgroundColor: '#000000aa',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    errorText.setOrigin(0.5);
    this.add(errorText);

    // Shake and fade
    this.scene.tweens.add({
      targets: errorText,
      x: { from: -5, to: 5 },
      duration: 50,
      repeat: 5,
      yoyo: true
    });

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: errorText,
        alpha: 0,
        duration: 500,
        onComplete: () => errorText.destroy()
      });
    });
  }

  public startCountdownTimer(durationMs: number): void {
    this.stopCountdownTimer(); // Stop any existing timer

    this.countdownBar.clear();
    this.countdownBar.setAlpha(1);

    // Draw initial full bar
    this.countdownBar.fillStyle(0x00ff00); // Green
    this.countdownBar.fillRect(0, 0, 200, 8);

    // Border
    this.countdownBar.lineStyle(2, 0xffffff);
    this.countdownBar.strokeRect(0, 0, 200, 8);

    // Animate the countdown
    this.countdownTween = this.scene.tweens.add({
      targets: { progress: 1 },
      progress: 0,
      duration: durationMs,
      ease: 'Linear',
      onUpdate: (tween) => {
        const progress = tween.getValue() || 0;
        this.countdownBar.clear();

        // Calculate color based on progress
        let fillColor = 0x00ff00; // Green
        if (progress < 0.5) fillColor = 0xffaa00; // Orange
        if (progress < 0.25) fillColor = 0xff0000; // Red

        // Draw progress bar
        this.countdownBar.fillStyle(fillColor);
        this.countdownBar.fillRect(0, 0, 200 * progress, 8);

        // Border
        this.countdownBar.lineStyle(2, 0xffffff);
        this.countdownBar.strokeRect(0, 0, 200, 8);
      },
      onComplete: () => {
        this.hideCountdownTimer();
      }
    });
  }

  public stopCountdownTimer(): void {
    if (this.countdownTween) {
      this.countdownTween.destroy();
      this.countdownTween = undefined;
    }
  }

  public hideCountdownTimer(): void {
    this.stopCountdownTimer();
    this.countdownBar.setAlpha(0);
    this.countdownBar.clear();
  }
}