import * as Phaser from 'phaser';
import { SpeechRecognitionResult } from '../services/SpeechRecognitionService';

export interface CastingDialogOptions {
  spellName: string;
  duration?: number; // Optional - only used for timer mode
  maxTries?: number; // Optional - only used for tries mode
  useTriesMode?: boolean; // If true, use tries instead of timer
  onTimerEnd: (results: SpeechRecognitionResult[]) => void;
  onClose?: () => void;
}

export class CastingDialog extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private spellNameText!: Phaser.GameObjects.Text;
  private currentWordText!: Phaser.GameObjects.Text;
  private comboWordsContainer!: Phaser.GameObjects.Container;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerTween?: Phaser.Tweens.Tween;
  private micIndicator!: Phaser.GameObjects.Graphics;
  private instructionText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private recordingBar!: Phaser.GameObjects.Graphics;
  private castButton!: Phaser.GameObjects.Container;
  private castButtonText!: Phaser.GameObjects.Text;

  private options: CastingDialogOptions;
  private comboWords: string[] = [];
  private comboResults: SpeechRecognitionResult[] = [];
  private isActive: boolean = false;
  private currentWord: string = '';
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private currentTries: number = 0;
  private triesDisplay?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, options: CastingDialogOptions) {
    super(scene, scene.cameras.main.width / 2, scene.cameras.main.height / 2);
    this.options = options;

    this.createDialog();
    scene.add.existing(this);
    this.setDepth(1000);
    this.setScrollFactor(0);
  }

  private createDialog(): void {
    // Semi-transparent background overlay
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRect(
      -this.scene.cameras.main.width / 2,
      -this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height
    );
    this.add(this.background);

    // Main dialog panel
    const panelWidth = 500;
    const panelHeight = 400;

    this.panel = this.scene.add.graphics();
    this.panel.fillStyle(0x1a1a2e, 0.95);
    this.panel.fillRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    this.panel.lineStyle(3, 0x16213e);
    this.panel.strokeRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    this.add(this.panel);

    // Spell name (smaller, secondary importance)
    this.spellNameText = this.scene.add.text(0, -160, this.options.spellName.toUpperCase(), {
      fontSize: '24px',
      color: '#00bfff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.spellNameText.setOrigin(0.5);
    this.add(this.spellNameText);

    // Current word to speak (large and prominent)
    this.currentWordText = this.scene.add.text(0, -60, '', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.currentWordText.setOrigin(0.5);
    this.add(this.currentWordText);

    // Microphone indicator
    this.micIndicator = this.scene.add.graphics();
    this.micIndicator.y = 20;
    this.add(this.micIndicator);

    // Combo words display area
    this.comboWordsContainer = this.scene.add.container(0, 80);
    this.add(this.comboWordsContainer);

    // State indicator (RECORDING, PROCESSING, etc)
    this.stateText = this.scene.add.text(0, 100, '', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'Arial',
      backgroundColor: '#000000aa',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    });
    this.stateText.setOrigin(0.5);
    this.add(this.stateText);

    // Recording bar (shows recording duration)
    this.recordingBar = this.scene.add.graphics();
    this.recordingBar.y = 130;
    this.add(this.recordingBar);

    // Instructions
    this.instructionText = this.scene.add.text(0, 150, 'Hold SPACE to record • SHIFT/ESC to exit', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    this.instructionText.setOrigin(0.5);
    this.instructionText.setAlpha(0.8);
    this.add(this.instructionText);

    // Timer bar at bottom (only for timer mode)
    this.timerBar = this.scene.add.graphics();
    this.timerBar.y = 180;
    this.add(this.timerBar);

    // Tries display (only for tries mode)
    if (this.options.useTriesMode) {
      this.triesDisplay = this.scene.add.text(0, 180, '', {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      });
      this.triesDisplay.setOrigin(0.5);
      this.add(this.triesDisplay);
    }

    // Cast Spell button
    this.createCastButton();

    // Animate in
    this.setScale(0);
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.out'
    });
  }

  public show(firstWord: string): void {
    this.isActive = true;
    this.currentWord = firstWord;
    this.currentWordText.setText(firstWord.toUpperCase());
    this.comboWords = [];
    this.comboResults = [];
    this.isRecording = false;

    if (this.options.useTriesMode) {
      // Initialize tries mode
      this.currentTries = 0;
      this.updateTriesDisplay();
      // Hide timer bar in tries mode
      this.timerBar.clear();
    } else {
      // Start timer for timer mode
      this.startTimer();
    }

    // Show ready state
    this.setRecordingState('ready');

    // Update instruction
    this.instructionText.setText('Hold SPACE to record • ENTER to cast spell');
  }

  private createCastButton(): void {
    // Create button container
    this.castButton = this.scene.add.container(200, 180);

    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0x4CAF50, 0.8); // Green color
    buttonBg.fillRoundedRect(-60, -20, 120, 40, 5);
    buttonBg.lineStyle(2, 0x45a049);
    buttonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
    this.castButton.add(buttonBg);

    // Button text
    this.castButtonText = this.scene.add.text(0, 0, '⚡ Cast (Enter)', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.castButtonText.setOrigin(0.5);
    this.castButton.add(this.castButtonText);

    // Make button interactive
    buttonBg.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);

    // Add hover effect
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x45a049, 0.9); // Darker green on hover
      buttonBg.fillRoundedRect(-60, -20, 120, 40, 5);
      buttonBg.lineStyle(2, 0x3d8b40);
      buttonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
      this.scene.input.setDefaultCursor('pointer');
    });

    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x4CAF50, 0.8);
      buttonBg.fillRoundedRect(-60, -20, 120, 40, 5);
      buttonBg.lineStyle(2, 0x45a049);
      buttonBg.strokeRoundedRect(-60, -20, 120, 40, 5);
      this.scene.input.setDefaultCursor('default');
    });

    // Add click handler
    buttonBg.on('pointerdown', () => {
      // Trigger spell casting if we have combo words
      if (this.comboResults.length > 0) {
        this.options.onTimerEnd(this.comboResults);
        this.close();
      }
    });

    // Initially hide if no combo
    this.updateCastButtonVisibility();

    this.add(this.castButton);
  }

  private updateCastButtonVisibility(): void {
    if (this.castButton) {
      // Show button only when we have at least one word in combo
      const hasCombo = this.comboWords.length > 0;
      this.castButton.setAlpha(hasCombo ? 1 : 0.3);

      if (this.castButtonText) {
        const comboText = hasCombo ?
          `⚡ Cast x${this.comboWords.length}` :
          '⚡ Cast (Enter)';
        this.castButtonText.setText(comboText);
      }
    }
  }

  private updateTriesDisplay(): void {
    if (this.triesDisplay && this.options.useTriesMode) {
      const maxTries = this.options.maxTries || 3;
      const remaining = maxTries - this.currentTries;

      // Show potion bottles for tries remaining (since we're using MP)
      let display = '';
      for (let i = 0; i < remaining; i++) {
        display += '🧪 '; // Full potion
      }
      for (let i = 0; i < this.currentTries; i++) {
        display += '💨 '; // Empty/used potion
      }

      this.triesDisplay.setText(display.trim());
    }
  }

  private startTimer(): void {
    // Skip timer creation in tries mode
    if (this.options.useTriesMode) {
      return;
    }

    const barWidth = 400;
    const barHeight = 12;

    // Draw initial full bar
    this.timerBar.clear();
    this.timerBar.fillStyle(0x00ff00);
    this.timerBar.fillRect(-barWidth / 2, 0, barWidth, barHeight);
    this.timerBar.lineStyle(2, 0xffffff);
    this.timerBar.strokeRect(-barWidth / 2, 0, barWidth, barHeight);

    // Timer starts paused - only counts down during recording
    this.timerTween = this.scene.tweens.add({
      targets: { progress: 1 },
      progress: 0,
      duration: this.options.duration,
      ease: 'Linear',
      paused: true, // Start paused
      onUpdate: (tween) => {
        const progress = tween.getValue() || 0;
        this.updateTimerBar(progress, barWidth, barHeight);
      },
      onComplete: () => {
        this.onTimerComplete();
      }
    });
  }

  private updateTimerBar(progress: number, width: number, height: number): void {
    this.timerBar.clear();

    // Check if timer is paused
    const isPaused = this.timerTween && this.timerTween.isPaused();

    // Color based on remaining time and pause state
    let color = 0x00ff00; // Green
    if (isPaused) {
      color = 0x666666; // Gray when paused
    } else {
      if (progress < 0.5) color = 0xffaa00; // Orange
      if (progress < 0.25) color = 0xff0000; // Red
    }

    // Draw progress
    this.timerBar.fillStyle(color);
    this.timerBar.fillRect(-width / 2, 0, width * progress, height);

    // Draw border (different style when paused)
    if (isPaused) {
      this.timerBar.lineStyle(2, 0x888888); // Gray border when paused
      this.timerBar.strokeRect(-width / 2, 0, width, height);
      // Add pause indicator
      this.timerBar.fillStyle(0xffffff);
      this.timerBar.fillRect(-3, -height/2 - 4, 2, 8);
      this.timerBar.fillRect(1, -height/2 - 4, 2, 8);
    } else {
      this.timerBar.lineStyle(2, 0xffffff);
      this.timerBar.strokeRect(-width / 2, 0, width, height);
    }
  }

  private pauseTimer(): void {
    // Skip in tries mode
    if (this.options.useTriesMode) return;

    if (this.timerTween && !this.timerTween.isPaused()) {
      this.timerTween.pause();
      console.log('⏸️ Timer paused');
      // Update visual to show paused state
      const progress = this.timerTween.getValue() || 0;
      this.updateTimerBar(progress, 400, 12);
    }
  }

  private resumeTimer(): void {
    // Skip in tries mode
    if (this.options.useTriesMode) return;

    if (this.timerTween && this.timerTween.isPaused()) {
      this.timerTween.resume();
      console.log('▶️ Timer resumed');
      // Update visual to show active state
      const progress = this.timerTween.getValue() || 0;
      this.updateTimerBar(progress, 400, 12);
    }
  }

  public setRecordingState(state: 'ready' | 'recording' | 'processing' | 'success' | 'error'): void {
    // Safety check: Don't update if dialog is being destroyed
    if (!this.active || !this.stateText || !this.stateText.active || !this.instructionText || !this.instructionText.active) {
      console.log('⚠️ Skipping state update - dialog not active');
      return;
    }

    // Control timer based on state
    switch (state) {
      case 'ready':
        this.pauseTimer(); // Pause while waiting for user input
        this.stateText.setText('🎤 READY');
        this.stateText.setColor('#00ff00');
        this.instructionText.setText('Hold SPACE to record • ENTER to cast');
        this.showMicReady();
        break;
      case 'recording':
        this.resumeTimer(); // Only count down during recording
        this.stateText.setText('🔴 RECORDING...');
        this.stateText.setColor('#ff0000');
        this.instructionText.setText('Release SPACE when done speaking');
        this.showMicRecording();
        this.recordingStartTime = Date.now();
        this.startRecordingAnimation();
        break;
      case 'processing':
        this.pauseTimer(); // Pause while processing audio
        this.stateText.setText('⏳ PROCESSING...');
        this.stateText.setColor('#ffaa00');
        this.instructionText.setText('Capturing word ending...');
        this.stopRecordingAnimation();
        break;
      case 'success':
        this.pauseTimer(); // Pause after successful recognition
        this.stateText.setText('✓ RECOGNIZED!');
        this.stateText.setColor('#00ff00');
        this.instructionText.setText('Great! Keep going! • ENTER to cast');
        break;
      case 'error':
        this.pauseTimer(); // Pause while showing error
        this.stateText.setText('❌ TRY AGAIN');
        this.stateText.setColor('#ff0000');
        this.instructionText.setText('Recovering... (1.5s)');
        this.showErrorRecoveryAnimation();
        break;
    }
  }

  private showMicReady(): void {
    if (!this.micIndicator || !this.micIndicator.active) return;

    this.micIndicator.clear();
    this.micIndicator.fillStyle(0x888888);
    this.micIndicator.fillCircle(0, 0, 8);
    this.micIndicator.lineStyle(2, 0xffffff);
    this.micIndicator.strokeCircle(0, 0, 8);
    this.scene.tweens.killTweensOf(this.micIndicator);
    this.micIndicator.setScale(1);
  }

  private showMicRecording(): void {
    if (!this.micIndicator || !this.micIndicator.active) return;

    this.micIndicator.clear();
    this.micIndicator.fillStyle(0xff0000);
    this.micIndicator.fillCircle(0, 0, 8);
    this.micIndicator.lineStyle(2, 0xffffff);
    this.micIndicator.strokeCircle(0, 0, 8);

    // Pulsing animation
    this.scene.tweens.add({
      targets: this.micIndicator,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private startRecordingAnimation(): void {
    if (!this.recordingBar || !this.recordingBar.active) return;

    // Animate recording bar to show duration
    this.scene.tweens.add({
      targets: { width: 0 },
      width: 200,
      duration: 5000, // Max 5 seconds recording
      ease: 'Linear',
      onUpdate: (tween) => {
        if (!this.recordingBar || !this.recordingBar.active) return;
        const width = tween.getValue() || 0;
        this.recordingBar.clear();
        this.recordingBar.fillStyle(0xff0000);
        this.recordingBar.fillRect(-width / 2, 0, width, 4);
      }
    });
  }

  private stopRecordingAnimation(): void {
    this.scene.tweens.killTweensOf({ width: 0 });
    if (this.recordingBar && this.recordingBar.active) {
      this.recordingBar.clear();
    }
  }

  private showErrorRecoveryAnimation(): void {
    if (!this.recordingBar || !this.recordingBar.active) return;

    // Show a red recovery bar that fills up over 1.5 seconds
    this.scene.tweens.add({
      targets: { width: 0 },
      width: 200,
      duration: 1500,
      ease: 'Linear',
      onUpdate: (tween) => {
        if (!this.recordingBar || !this.recordingBar.active) return;
        const width = tween.getValue() || 0;
        this.recordingBar.clear();
        this.recordingBar.fillStyle(0xff0000, 0.5); // Semi-transparent red
        this.recordingBar.fillRect(-width / 2, 0, width, 4);
      },
      onComplete: () => {
        if (!this.recordingBar || !this.recordingBar.active) return;
        this.recordingBar.clear();
        // Update instruction text when recovery is complete
        if (this.instructionText && this.instructionText.active) {
          this.instructionText.setText('Hold SPACE to try again • ENTER to cast');
        }
      }
    });
  }

  public handleWordSuccess(word: string, result: SpeechRecognitionResult): void {
    if (!this.isActive) return;

    // Add to combo
    this.comboWords.push(word);
    this.comboResults.push(result);

    // Show success feedback
    this.showWordSuccess(word, result.isCriticalHit);

    // Update combo display
    this.updateComboDisplay();

    // Update cast button to show combo count
    this.updateCastButtonVisibility();

    // Get next word
    const nextWord = this.getNextWord();
    if (nextWord) {
      this.currentWord = nextWord;
      this.currentWordText.setText(nextWord.toUpperCase());

      // Animate word change
      this.scene.tweens.add({
        targets: this.currentWordText,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 200,
        ease: 'Back.out'
      });

      // Update instruction
      if (this.comboWords.length === 1) {
        this.instructionText.setText('Great! SPACE for next • ENTER to cast');
      } else {
        this.instructionText.setText(`Combo x${this.comboWords.length}! SPACE to continue • ENTER to cast`);
      }
    }
  }

  private showWordSuccess(word: string, isCritical: boolean): void {
    const successText = this.scene.add.text(
      0,
      -20,
      isCritical ? `💥 ${word.toUpperCase()} 💥` : `✓ ${word}`,
      {
        fontSize: isCritical ? '28px' : '20px',
        color: isCritical ? '#ffd700' : '#00ff00',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    successText.setOrigin(0.5);
    this.add(successText);

    // Animate and fade
    this.scene.tweens.add({
      targets: successText,
      y: -100,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.out',
      onComplete: () => successText.destroy()
    });
  }

  private updateComboDisplay(): void {
    // Clear existing combo display
    this.comboWordsContainer.removeAll(true);

    // Show last few combo words
    const displayCount = Math.min(3, this.comboWords.length);
    const startIdx = Math.max(0, this.comboWords.length - displayCount);

    for (let i = 0; i < displayCount; i++) {
      const wordIdx = startIdx + i;
      const word = this.comboWords[wordIdx];
      const yPos = i * 25;

      const wordText = this.scene.add.text(-150, yPos, word, {
        fontSize: '18px',
        color: '#00ff00',
        fontFamily: 'Arial'
      });

      const checkmark = this.scene.add.text(150, yPos, '✓', {
        fontSize: '18px',
        color: '#00ff00',
        fontFamily: 'Arial'
      });

      this.comboWordsContainer.add([wordText, checkmark]);
    }

    if (this.comboWords.length > 3) {
      const moreText = this.scene.add.text(0, -25, `+${this.comboWords.length - 3} more`, {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial'
      });
      moreText.setOrigin(0.5);
      this.comboWordsContainer.add(moreText);
    }
  }

  private getNextWord(): string | null {
    // Note: This is not used anymore - GameScene manages word selection
    // The word is set via setNextWord() from GameScene
    return null;
  }

  public getCurrentWord(): string {
    return this.currentWord;
  }

  private onTimerComplete(): void {
    this.isActive = false;

    // Stop mic indicator animation
    this.scene.tweens.killTweensOf(this.micIndicator);
    if (this.micIndicator && this.micIndicator.active) {
      this.micIndicator.clear();
    }

    // Show completion message
    const resultText = this.comboWords.length > 0
      ? `Combo x${this.comboWords.length}! Casting spell...`
      : 'No words spoken. Spell fizzled...';

    if (this.instructionText && this.instructionText.active) {
      this.instructionText.setText(resultText);
    }
    if (this.currentWordText && this.currentWordText.active) {
      this.currentWordText.setText('');
    }

    // Quick transition to next spell (reduced from 1000ms for better game flow)
    this.scene.time.delayedCall(300, () => {
      this.options.onTimerEnd(this.comboResults);
      this.close();
    });
  }

  public close(): void {
    if (this.timerTween) {
      this.timerTween.destroy();
    }

    // Animate out
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.in',
      onComplete: () => {
        if (this.options.onClose) {
          this.options.onClose();
        }
        this.destroy();
      }
    });
  }

  public setNextWord(word: string): void {
    if (!this.active || !this.currentWordText || !this.currentWordText.active) {
      console.log('⚠️ Skipping word update - dialog not active');
      return;
    }

    this.currentWord = word;
    this.currentWordText.setText(word.toUpperCase());

    // Animate word change
    this.scene.tweens.add({
      targets: this.currentWordText,
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.out'
    });
  }

  public startRecording(): void {
    this.isRecording = true;
    this.setRecordingState('recording');
  }

  public stopRecording(): void {
    this.isRecording = false;
    this.setRecordingState('processing');

    // Log recording duration for debugging
    if (this.recordingStartTime > 0) {
      const duration = Date.now() - this.recordingStartTime;
      console.log(`🎤 Recording duration: ${duration}ms`);
    }
  }

  public isRecordingActive(): boolean {
    return this.isRecording;
  }

  public getActive(): boolean {
    return this.isActive;
  }

  public getComboResults(): SpeechRecognitionResult[] {
    return [...this.comboResults]; // Return a copy to prevent external modification
  }

  public handleWordError(): void {
    if (this.options.useTriesMode) {
      // Increment tries counter
      this.currentTries++;
      this.updateTriesDisplay();

      // Check if we've exceeded max tries
      const maxTries = this.options.maxTries || 3;
      if (this.currentTries >= maxTries) {
        // Out of tries - end the spell casting
        this.isActive = false;
        this.instructionText.setText('Out of tries! Spell fizzled...');

        // End after brief pause
        this.scene.time.delayedCall(1000, () => {
          this.options.onTimerEnd(this.comboResults);
          this.close();
        });
        return;
      }
    }

    this.setRecordingState('error');

    // Brief pause then ready to try again
    this.scene.time.delayedCall(1500, () => {
      this.setRecordingState('ready');
    });
  }
}