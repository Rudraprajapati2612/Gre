import { create } from 'zustand';

export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';
export type Tone = 'formal' | 'neutral' | 'positive' | 'negative' | 'informal';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  tone: Tone;
  examples: string[];
  greContext: string;
  cluster: string;
  synonyms: string[];
  antonyms: string[];
  groupNumber: number;
  
  // SM-2 fields
  ease: number;
  intervalDays: number;
  dueDate: string | null; // ISO string
  repetitions: number;
  timesSeen: number;
  timesWrong: number;
  
  status: WordStatus;
  userNote?: string;
}

export interface MountainGroup {
  id: number;
  title: string;
  isComplete: boolean;
  totalWords: number;
  unseen: number;
  knew: number;
  forgot: number;
  words: string[]; // word ids
}

export interface UserProgress {
  streakDays: number;
  wordsMastered: number;
  wordsLearning: number;
  wordsReview: number;
  wordsDueToday: number;
}

// Mock Data
export const INITIAL_WORDS: Word[] = [
  {
    id: '1', word: 'apocryphal', meaning: '(of a story or statement) of doubtful authenticity, although widely circulated as being true.',
    tone: 'formal', examples: ['an apocryphal story about a former president', 'his reported remarks are apocryphal'],
    greContext: 'Used often in history / text completion passages referencing disputed facts.', cluster: 'Truth/Doubt',
    synonyms: ['fictitious', 'made-up', 'untrue', 'fabricated'], antonyms: ['authentic', 'true'], groupNumber: 1,
    ease: 2.5, intervalDays: 0, dueDate: null, repetitions: 0, timesSeen: 0, timesWrong: 0, status: 'new'
  },
  {
    id: '2', word: 'ephemeral', meaning: 'lasting for a very short time.',
    tone: 'neutral', examples: ['fashions are ephemeral'],
    greContext: 'Common in reading comprehension passages about art, nature, or pop culture.', cluster: 'Time',
    synonyms: ['transitory', 'transient', 'fleeting'], antonyms: ['long-lived', 'permanent'], groupNumber: 1,
    ease: 2.5, intervalDays: 0, dueDate: null, repetitions: 0, timesSeen: 0, timesWrong: 0, status: 'new'
  },
  {
    id: '3', word: 'mitigate', meaning: 'make less severe, serious, or painful.',
    tone: 'positive', examples: ['he wanted to mitigate misery in the world'],
    greContext: 'Extremely common in TC/SE. Know this cold.', cluster: 'Ease/Relieve',
    synonyms: ['alleviate', 'reduce', 'diminish', 'lessen'], antonyms: ['aggravate', 'increase', 'intensify'], groupNumber: 1,
    ease: 2.5, intervalDays: 1, dueDate: new Date().toISOString(), repetitions: 1, timesSeen: 2, timesWrong: 0, status: 'review'
  },
  {
    id: '4', word: 'obfuscate', meaning: 'render obscure, unclear, or unintelligible.',
    tone: 'negative', examples: ['the spelling changes will deform some familiar words and obfuscate their etymological origins'],
    greContext: 'Common in writing/critique passages.', cluster: 'Confusion',
    synonyms: ['obscure', 'confuse', 'blur'], antonyms: ['clarify'], groupNumber: 1,
    ease: 2.5, intervalDays: 0, dueDate: null, repetitions: 0, timesSeen: 0, timesWrong: 0, status: 'new'
  },
  {
    id: '5', word: 'cacophony', meaning: 'a harsh, discordant mixture of sounds.',
    tone: 'negative', examples: ['a cacophony of deafening alarm bells'],
    greContext: 'Can trace back to musical or chaotic urban environments.', cluster: 'Sound/Noise',
    synonyms: ['din', 'racket', 'noise', 'clamor'], antonyms: ['harmony', 'silence'], groupNumber: 2,
    ease: 2.5, intervalDays: 0, dueDate: null, repetitions: 0, timesSeen: 0, timesWrong: 0, status: 'new'
  }
];

export const INITIAL_GROUPS: MountainGroup[] = [
  { id: 1, title: 'Group 1', isComplete: false, totalWords: 4, unseen: 3, knew: 1, forgot: 0, words: ['1', '2', '3', '4'] },
  { id: 2, title: 'Group 2', isComplete: false, totalWords: 1, unseen: 1, knew: 0, forgot: 0, words: ['5'] },
  { id: 3, title: 'Group 3', isComplete: false, totalWords: 5, unseen: 5, knew: 0, forgot: 0, words: [] },
  { id: 4, title: 'Group 4', isComplete: false, totalWords: 5, unseen: 5, knew: 0, forgot: 0, words: [] },
];
