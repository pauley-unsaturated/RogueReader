#!/usr/bin/env node

/**
 * Word List Audit Tool
 * Compares RogueReader word lists against Dolch and Fry sight word standards
 *
 * Usage: node tools/audit-word-lists.js
 */

const fs = require('fs');
const path = require('path');

// Dolch sight words by level
const DOLCH = {
  'Pre-Primer': ['a', 'and', 'away', 'big', 'blue', 'can', 'come', 'down', 'find', 'for', 'funny', 'go', 'help', 'here', 'I', 'in', 'is', 'it', 'jump', 'little', 'look', 'make', 'me', 'my', 'not', 'one', 'play', 'red', 'run', 'said', 'see', 'the', 'three', 'to', 'two', 'up', 'we', 'where', 'yellow', 'you'],

  'Primer': ['all', 'am', 'are', 'at', 'ate', 'be', 'black', 'brown', 'but', 'came', 'did', 'do', 'eat', 'four', 'get', 'good', 'have', 'he', 'into', 'like', 'must', 'new', 'no', 'now', 'on', 'our', 'out', 'please', 'pretty', 'ran', 'ride', 'saw', 'say', 'she', 'so', 'soon', 'that', 'there', 'they', 'this', 'too', 'under', 'want', 'was', 'well', 'went', 'what', 'white', 'who', 'will', 'with', 'yes'],

  'First': ['after', 'again', 'an', 'any', 'as', 'ask', 'by', 'could', 'every', 'fly', 'from', 'give', 'going', 'had', 'has', 'her', 'him', 'his', 'how', 'just', 'know', 'let', 'live', 'may', 'of', 'old', 'once', 'open', 'over', 'put', 'round', 'some', 'stop', 'take', 'thank', 'them', 'then', 'think', 'walk', 'were', 'when'],

  'Second': ['always', 'around', 'because', 'been', 'before', 'best', 'both', 'buy', 'call', 'cold', 'does', 'don\'t', 'fast', 'first', 'five', 'found', 'gave', 'goes', 'green', 'its', 'made', 'many', 'off', 'or', 'pull', 'read', 'right', 'sing', 'sit', 'sleep', 'tell', 'their', 'these', 'those', 'upon', 'us', 'use', 'very', 'wash', 'which', 'why', 'wish', 'work', 'would', 'write', 'your'],

  'Third': ['about', 'better', 'bring', 'carry', 'clean', 'cut', 'done', 'draw', 'drink', 'eight', 'fall', 'far', 'full', 'got', 'grow', 'hold', 'hot', 'hurt', 'if', 'keep', 'kind', 'laugh', 'light', 'long', 'much', 'myself', 'never', 'only', 'own', 'pick', 'seven', 'shall', 'show', 'six', 'small', 'start', 'ten', 'today', 'together', 'try', 'warm']
};

// Fry sight words (first 300)
const FRY_FIRST_100 = ['a', 'about', 'all', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'called', 'can', 'come', 'could', 'day', 'did', 'do', 'down', 'each', 'find', 'first', 'for', 'from', 'get', 'go', 'had', 'has', 'have', 'he', 'her', 'him', 'his', 'how', 'I', 'if', 'in', 'into', 'is', 'it', 'its', 'like', 'long', 'look', 'made', 'make', 'many', 'may', 'more', 'my', 'no', 'not', 'now', 'number', 'of', 'on', 'one', 'or', 'other', 'out', 'part', 'people', 'said', 'see', 'she', 'so', 'some', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'time', 'to', 'two', 'up', 'use', 'was', 'water', 'way', 'we', 'were', 'what', 'when', 'which', 'who', 'will', 'with', 'words', 'would', 'write', 'you', 'your'];

const FRY_SECOND_100 = ['after', 'again', 'air', 'also', 'America', 'animal', 'another', 'answer', 'any', 'around', 'ask', 'away', 'back', 'because', 'before', 'big', 'boy', 'came', 'change', 'different', 'does', 'end', 'even', 'follow', 'form', 'found', 'give', 'good', 'great', 'hand', 'help', 'here', 'home', 'house', 'just', 'kind', 'know', 'land', 'large', 'learn', 'letter', 'line', 'little', 'live', 'man', 'me', 'means', 'men', 'most', 'mother', 'move', 'much', 'must', 'name', 'need', 'new', 'off', 'old', 'only', 'our', 'over', 'page', 'picture', 'place', 'play', 'point', 'put', 'read', 'right', 'same', 'say', 'sentence', 'set', 'should', 'show', 'small', 'sound', 'spell', 'still', 'study', 'such', 'take', 'tell', 'things', 'think', 'three', 'through', 'too', 'try', 'turn', 'us', 'very', 'want', 'well', 'went', 'where', 'why', 'work', 'world', 'years'];

const FRY_THIRD_100 = ['above', 'add', 'almost', 'along', 'always', 'began', 'begin', 'being', 'below', 'between', 'book', 'both', 'car', 'carry', 'children', 'city', 'close', 'country', 'cut', 'don\'t', 'earth', 'eat', 'enough', 'every', 'example', 'eyes', 'face', 'family', 'far', 'father', 'feet', 'few', 'food', 'four', 'girl', 'got', 'group', 'grow', 'hard', 'head', 'hear', 'high', 'idea', 'important', 'Indian', 'it\'s', 'keep', 'last', 'late', 'leave', 'left', 'let', 'life', 'light', 'list', 'might', 'mile', 'miss', 'mountain', 'near', 'never', 'next', 'night', 'often', 'once', 'open', 'own', 'paper', 'plant', 'real', 'river', 'run', 'saw', 'school', 'sea', 'second', 'seen', 'side', 'something', 'sometimes', 'song', 'soon', 'start', 'state', 'stop', 'story', 'talk', 'those', 'thought', 'together', 'took', 'tree', 'under', 'until', 'walk', 'watch', 'while', 'white', 'without', 'young'];

// Common nouns kids should know early
const COMMON_NOUNS = ['dog', 'cat', 'bird', 'fish', 'tree', 'sun', 'moon', 'star', 'rain', 'snow', 'mom', 'dad', 'home', 'school', 'book', 'ball', 'car', 'bike', 'bed', 'food', 'milk', 'water'];

function readWordList(level) {
  const filePath = path.join(__dirname, '..', 'src', 'data', 'words', `level-${level.toString().padStart(2, '0')}.txt`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const words = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(word => word.toLowerCase());

    return words;
  } catch (err) {
    console.error(`Error reading level ${level}: ${err.message}`);
    return [];
  }
}

function checkCoverage(standard, levelWords, standardName) {
  const missing = [];
  const present = [];

  for (const word of standard) {
    const wordLower = word.toLowerCase().replace(/'/g, "'"); // Handle apostrophes
    if (levelWords.includes(wordLower)) {
      present.push(word);
    } else {
      missing.push(word);
    }
  }

  return {
    total: standard.length,
    present: present.length,
    missing: missing.length,
    missingWords: missing,
    coverage: ((present.length / standard.length) * 100).toFixed(1)
  };
}

function auditLevel(level, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`LEVEL ${level}: ${description}`);
  console.log('='.repeat(70));

  const words = readWordList(level);
  console.log(`Total words in list: ${words.length}`);

  return { level, words, count: words.length };
}

function main() {
  console.log('\n🔍 ROGUE READER WORD LIST AUDIT');
  console.log('Comparing against Dolch and Fry sight word standards\n');

  // Audit Levels 1-3 (CVC words)
  const level1 = auditLevel(1, 'CVC Words with "a" (Pre-K/K)');
  const level2 = auditLevel(2, 'CVC Words with "a" and "e" (Late K)');
  const level3 = auditLevel(3, 'CVC Words with "a", "e", "i" (K)');

  // Audit Levels 4-5 (Sight words - should align with Dolch/Fry)
  const level4 = auditLevel(4, 'First Sight Words + CVC (1st Grade)');
  const level5 = auditLevel(5, 'More Sight Words (1st Grade continued)');

  // Check Level 4 against Dolch Pre-Primer + Primer
  console.log('\n📊 Checking Level 4 against Dolch Pre-Primer + Primer:');
  const dolchPrePrimer = checkCoverage(DOLCH['Pre-Primer'], level4.words, 'Dolch Pre-Primer');
  console.log(`  Pre-Primer: ${dolchPrePrimer.present}/${dolchPrePrimer.total} (${dolchPrePrimer.coverage}%)`);
  if (dolchPrePrimer.missing > 0) {
    console.log(`  Missing: ${dolchPrePrimer.missingWords.join(', ')}`);
  }

  const dolchPrimer = checkCoverage(DOLCH['Primer'], level4.words, 'Dolch Primer');
  console.log(`  Primer: ${dolchPrimer.present}/${dolchPrimer.total} (${dolchPrimer.coverage}%)`);
  if (dolchPrimer.missing > 0 && dolchPrimer.missing <= 10) {
    console.log(`  Missing: ${dolchPrimer.missingWords.join(', ')}`);
  }

  // Check Level 5 against Dolch First Grade
  console.log('\n📊 Checking Level 5 against Dolch First Grade:');
  const dolchFirst = checkCoverage(DOLCH['First'], level5.words, 'Dolch First');
  console.log(`  First Grade: ${dolchFirst.present}/${dolchFirst.total} (${dolchFirst.coverage}%)`);
  if (dolchFirst.missing > 0 && dolchFirst.missing <= 10) {
    console.log(`  Missing: ${dolchFirst.missingWords.join(', ')}`);
  }

  // Check Levels 4-5 combined against Fry First 100
  const combined45 = [...level4.words, ...level5.words];
  console.log('\n📊 Checking Levels 4-5 combined against Fry First 100:');
  const fryFirst = checkCoverage(FRY_FIRST_100, combined45, 'Fry First 100');
  console.log(`  Coverage: ${fryFirst.present}/${fryFirst.total} (${fryFirst.coverage}%)`);
  if (fryFirst.missing > 0 && fryFirst.missing <= 15) {
    console.log(`  Missing: ${fryFirst.missingWords.join(', ')}`);
  }

  // Check common nouns across all early levels
  console.log('\n📊 Checking Common Nouns across Levels 1-6:');
  const levels16 = [
    ...readWordList(1),
    ...readWordList(2),
    ...readWordList(3),
    ...readWordList(4),
    ...readWordList(5),
    ...readWordList(6)
  ];
  const nounsCoverage = checkCoverage(COMMON_NOUNS, levels16, 'Common Nouns');
  console.log(`  Coverage: ${nounsCoverage.present}/${nounsCoverage.total} (${nounsCoverage.coverage}%)`);
  if (nounsCoverage.missing > 0) {
    console.log(`  Missing: ${nounsCoverage.missingWords.join(', ')}`);
  }

  // Summary statistics
  console.log('\n📈 SUMMARY BY LEVEL:');
  console.log('Level | Words | Description');
  console.log('------|-------|------------');
  for (let i = 1; i <= 20; i++) {
    const words = readWordList(i);
    const desc = getLevelDescription(i);
    console.log(`  ${i.toString().padStart(2)}  | ${words.length.toString().padStart(5)} | ${desc}`);
  }

  console.log('\n✅ Audit complete!\n');
}

function getLevelDescription(level) {
  const descriptions = {
    1: 'CVC with "a"',
    2: 'CVC with "a", "e"',
    3: 'CVC with "a", "e", "i"',
    4: 'First Sight Words',
    5: 'More Sight Words',
    6: 'CVC with "o", "u"',
    7: 'Beginning Blends',
    8: 'Ending Blends',
    9: '2nd Grade Sight Words',
    10: '3rd Grade Sight Words',
    11: 'Long Vowel Patterns',
    12: 'Vowel Teams',
    13: '4th Grade Vocabulary',
    14: '5th Grade Vocabulary',
    15: 'Advanced 5th Grade',
    16: '6th Grade',
    17: '7th Grade',
    18: '8th Grade',
    19: '9th Grade',
    20: '10th Grade'
  };
  return descriptions[level] || 'Unknown';
}

// Run the audit
main();
