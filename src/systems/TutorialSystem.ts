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
        text: "You are a young wizard learning to read magical spells.\n\nRead words aloud to cast spells and defeat enemies!",
        speakText: "Welcome to Rogue Reader! You are a young wizard learning to read magical spells. Read words aloud to cast spells and defeat enemies!",
        pauseGame: true
      },
      {
        title: "Movement",
        text: "Use ARROW KEYS to move around the dungeon.\n\nExplore rooms to find enemies, treasure, and secrets!",
        speakText: "Use the arrow keys to move around the dungeon. Explore rooms to find enemies, treasure, and secrets!",
        pauseGame: true
      },
      {
        title: "Combat",
        text: "When enemies are near, you'll see words appear.\n\nRead each word to cast a spell and damage enemies!",
        speakText: "When enemies are near, you'll see words appear. Read each word to cast a spell and damage enemies!",
        pauseGame: true
      },
      {
        title: "Combo System",
        text: "Read words quickly to build COMBOS!\n\nHigher combos = More damage!\n\n1x → 1.5x → 2x → 2.5x → 3x",
        speakText: "Read words quickly to build combos! Higher combos mean more damage! Chain your spells from one times to three times damage!",
        pauseGame: true
      },
      {
        title: "Word Difficulty",
        text: "Harder words deal MORE damage!\n\nSimple: cat (1x)\nMedium: rabbit (1.5x)\nComplex: butterfly (2.5x)",
        speakText: "Harder words deal more damage! Simple words like cat do normal damage. Medium words like rabbit do extra damage. Complex words like butterfly do massive damage!",
        pauseGame: true
      },
      {
        title: "Your Goal",
        text: "Defeat enemies, collect treasure, and reach the boss!\n\nEach floor gets harder but teaches new words.\n\nGood luck, young wizard!",
        speakText: "Your goal is to defeat enemies, collect treasure, and reach the boss! Each floor gets harder but teaches new words. Good luck, young wizard!",
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

    // Speak the text
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

    // Add instructions
    const instructions = this.scene.add.text(0, dialogHeight/2 - 40,
      this.currentStep < this.steps.length - 1 ?
        'Press ENTER to continue • Press SPACE to skip tutorial' :
        'Press ENTER to start playing • Press SPACE to skip',
      {
        fontSize: '16px',
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

    // Pulse animation for title
    this.scene.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
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