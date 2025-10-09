import * as Phaser from 'phaser';

export interface TutorialStep {
  title: string;
  text: string;
  speakText?: string; // Optional different text for speech
  image?: string;
  position?: 'center' | 'top' | 'bottom';
  pauseGame?: boolean;
}

export class TutorialSystem {
  private scene: Phaser.Scene;
  private currentStep: number = 0;
  private steps: TutorialStep[];
  private container?: Phaser.GameObjects.Container;
  private isActive: boolean = false;
  private speechSynthesis?: SpeechSynthesis;
  private currentUtterance?: SpeechSynthesisUtterance;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.steps = this.getIntroTutorialSteps();

    // Check if speech synthesis is available
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  private getIntroTutorialSteps(): TutorialStep[] {
    return [
      {
        title: "Welcome to RogueReader!",
        text: "You are a young wizard learning magical reading spells!\n\nLet's learn how to play!",
        speakText: "Welcome to Rogue Reader! You are a young wizard learning magical reading spells! Let's learn how to play!",
        pauseGame: true
      },
      {
        title: "Moving Around",
        text: "Use the ARROW KEYS ↑ ↓ ← → to walk.\n\nExplore rooms to find treasure and enemies!",
        speakText: "Moving Around. Use the arrow keys to walk. Explore rooms to find treasure and enemies!",
        pauseGame: true
      },
      {
        title: "Casting Spells",
        text: "When you see a word, HOLD SPACEBAR and read it out loud!\n\nRelease SPACEBAR when done.\n\nThe computer will hear you!",
        speakText: "Casting Spells. When you see a word, hold spacebar and read it out loud! Release spacebar when done. The computer will hear you!",
        pauseGame: true
      },
      {
        title: "Spell Limit",
        text: "You can read 2 words before the spell fires.\n\n⭕ ⭕ = 2 spell slots\n\nWhen both are full, your spell casts automatically!",
        speakText: "Spell Limit. You can read 2 words before the spell fires. When both spell slots are full, your spell casts automatically!",
        pauseGame: true
      },
      {
        title: "Your Goal",
        text: "Defeat enemies and find the boss room!\n\nEach floor has new words to learn.\n\nYou've got this, wizard!",
        speakText: "Your Goal. Defeat enemies and find the boss room! Each floor has new words to learn. You've got this, wizard!",
        pauseGame: true
      }
    ];
  }

  public start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.currentStep = 0;
    this.showStep(this.steps[this.currentStep]);
  }

  private showStep(step: TutorialStep): void {
    // Create container for tutorial UI
    this.createTutorialDialog(step);

    // Speak the text (including title for clarity)
    if (this.speechSynthesis && step.speakText) {
      this.speak(step.speakText);
    }

    // Set up input handlers
    this.setupInputHandlers();
  }

  private createTutorialDialog(step: TutorialStep): void {
    // Remove existing container
    if (this.container) {
      this.container.destroy();
    }

    const { width, height } = this.scene.cameras.main;

    // Create container at center
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(1000);

    // Create backdrop with gradient
    const backdrop = this.scene.add.graphics();
    backdrop.fillStyle(0x000000, 0.85);
    backdrop.fillRect(-width/2, -height/2, width, height);
    this.container.add(backdrop);

    // Add twinkling stars effect
    this.createStarsEffect(width, height);

    // Create dialog box
    const dialogWidth = 600;
    const dialogHeight = 300;
    const dialog = this.scene.add.graphics();

    // Draw dialog background with slightly less opacity to see stars
    dialog.fillStyle(0x2c3e50, 0.98);
    dialog.fillRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 16);

    // Draw border with glow effect
    dialog.lineStyle(3, 0x3498db, 1);
    dialog.strokeRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 16);

    // Add subtle inner glow
    dialog.lineStyle(1, 0x5dade2, 0.5);
    dialog.strokeRoundedRect(-dialogWidth/2 + 2, -dialogHeight/2 + 2, dialogWidth - 4, dialogHeight - 4, 14);

    this.container.add(dialog);

    // Add title
    const title = this.scene.add.text(0, -dialogHeight/2 + 30, step.title, {
      fontSize: '32px',
      color: '#3498db',
      fontFamily: 'Arial Black',
      align: 'center'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Add main text
    const mainText = this.scene.add.text(0, 0, step.text, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: dialogWidth - 60 }
    });
    mainText.setOrigin(0.5);
    this.container.add(mainText);

    // Add "Next" button (large and kid-friendly)
    const buttonY = dialogHeight/2 - 60;
    const isLastStep = this.currentStep >= this.steps.length - 1;

    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(isLastStep ? 0x27ae60 : 0x3498db, 1); // Green for last step, blue otherwise
    buttonBg.fillRoundedRect(-100, buttonY - 25, 200, 50, 10);
    buttonBg.lineStyle(3, 0xffffff, 0.5);
    buttonBg.strokeRoundedRect(-100, buttonY - 25, 200, 50, 10);
    this.container.add(buttonBg);

    // Button text
    const buttonText = this.scene.add.text(0, buttonY,
      isLastStep ? "Start Playing!" : "Next →",
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial Black',
        align: 'center'
      }
    );
    buttonText.setOrigin(0.5);
    this.container.add(buttonText);

    // Make button interactive
    buttonBg.setInteractive(new Phaser.Geom.Rectangle(-100, buttonY - 25, 200, 50), Phaser.Geom.Rectangle.Contains);

    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(isLastStep ? 0x2ecc71 : 0x5dade2, 1); // Brighter on hover
      buttonBg.fillRoundedRect(-100, buttonY - 25, 200, 50, 10);
      buttonBg.lineStyle(3, 0xffffff, 0.8);
      buttonBg.strokeRoundedRect(-100, buttonY - 25, 200, 50, 10);
      this.scene.input.setDefaultCursor('pointer');
    });

    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(isLastStep ? 0x27ae60 : 0x3498db, 1);
      buttonBg.fillRoundedRect(-100, buttonY - 25, 200, 50, 10);
      buttonBg.lineStyle(3, 0xffffff, 0.5);
      buttonBg.strokeRoundedRect(-100, buttonY - 25, 200, 50, 10);
      this.scene.input.setDefaultCursor('default');
    });

    buttonBg.on('pointerdown', () => {
      this.nextStep();
    });

    // Also make backdrop clickable to advance
    backdrop.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
    backdrop.on('pointerdown', () => {
      this.nextStep();
    });

    // Add instructions (smaller, less prominent)
    const instructions = this.scene.add.text(0, dialogHeight/2 - 15,
      'Click anywhere or press ENTER to continue',
      {
        fontSize: '14px',
        color: '#95a5a6',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    instructions.setOrigin(0.5);
    this.container.add(instructions);

    // Add step counter
    const stepCounter = this.scene.add.text(dialogWidth/2 - 20, -dialogHeight/2 + 20,
      `${this.currentStep + 1}/${this.steps.length}`,
      {
        fontSize: '14px',
        color: '#95a5a6',
        fontFamily: 'Arial'
      }
    );
    stepCounter.setOrigin(1, 0);
    this.container.add(stepCounter);

    // Pulse animation for button
    this.scene.tweens.add({
      targets: buttonText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createStarsEffect(width: number, height: number): void {
    // Add animated stars for magical ambiance
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(-width/2, width/2);
      const y = Phaser.Math.Between(-height/2, height/2);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.8);

      const star = this.scene.add.circle(x, y, size, 0xffffff, alpha);
      this.container?.add(star);

      // Twinkle animation
      this.scene.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000)
      });

      // Gentle floating motion for some stars
      if (Math.random() > 0.5) {
        this.scene.tweens.add({
          targets: star,
          x: x + Phaser.Math.Between(-20, 20),
          y: y + Phaser.Math.Between(-20, 20),
          duration: Phaser.Math.Between(3000, 5000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  private setupInputHandlers(): void {
    // Remove existing handlers
    this.scene.input.keyboard?.off('keydown-ENTER');
    this.scene.input.keyboard?.off('keydown-SPACE');

    // Continue to next step
    this.scene.input.keyboard?.once('keydown-ENTER', () => {
      this.nextStep();
    });

    // Skip tutorial
    this.scene.input.keyboard?.once('keydown-SPACE', () => {
      this.skip();
    });
  }

  private nextStep(): void {
    // Stop current speech
    this.stopSpeaking();

    this.currentStep++;

    if (this.currentStep < this.steps.length) {
      this.showStep(this.steps[this.currentStep]);
    } else {
      this.complete();
    }
  }

  private skip(): void {
    // Stop current speech
    this.stopSpeaking();

    const skipConfirm = confirm("Skip the tutorial? You can review it later from the menu.");
    if (skipConfirm) {
      this.complete();
    } else {
      // Re-setup handlers if user cancels
      this.setupInputHandlers();
    }
  }

  private complete(): void {
    this.isActive = false;

    // Clean up
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }

    // Stop any speech
    this.stopSpeaking();

    // Mark tutorial as completed
    localStorage.setItem('roguereader_tutorial_completed', 'true');

    // Emit completion event
    this.scene.events.emit('tutorial-completed');
  }

  private speak(text: string): void {
    if (!this.speechSynthesis) return;

    // Stop any current speech
    this.stopSpeaking();

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);

    // Configure voice settings
    this.currentUtterance.rate = 0.9; // Slightly slower for clarity
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 0.8;

    // Try to use a friendly voice
    const voices = this.speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));

    if (englishVoices.length > 0) {
      // Prefer female voices for a friendly tutorial feel
      const femaleVoice = englishVoices.find(voice =>
        voice.name.includes('Female') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria')
      );

      this.currentUtterance.voice = femaleVoice || englishVoices[0];
    }

    // Speak
    this.speechSynthesis.speak(this.currentUtterance);
  }

  private stopSpeaking(): void {
    if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = undefined;
  }

  public hasBeenCompleted(): boolean {
    return localStorage.getItem('roguereader_tutorial_completed') === 'true';
  }

  public reset(): void {
    localStorage.removeItem('roguereader_tutorial_completed');
  }
}