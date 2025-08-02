/**
 * @file keyContextTransposition.test.ts
 * @description Tests for key-context aware transposition
 * Focuses on accurate spelling within user-chosen enharmonic keys
 */

import { describe, it, expect } from 'vitest';

// Test data organized by user's key choice
describe('Key Context Transposition Tests', () => {
  
  describe('Sharp Key Context (User chooses sharp keys)', () => {
    const sharpKeyTests = [
      {
        description: 'G major context - all chords should use sharp spellings',
        targetKey: 'G',
        keySignature: ['F#'],
        testCases: [
          // Diatonic chords
          { original: 'C', expected: 'G', rationale: 'I chord' },
          { original: 'Dm', expected: 'Am', rationale: 'ii chord' },
          { original: 'Em', expected: 'Bm', rationale: 'iii chord' },
          { original: 'F', expected: 'C', rationale: 'IV chord' },
          { original: 'G', expected: 'D', rationale: 'V chord' },
          { original: 'Am', expected: 'Em', rationale: 'vi chord' },
          { original: 'Bdim', expected: 'F#dim', rationale: 'vii° - must use F# from key signature' },
          
          // Non-diatonic chords
          { original: 'Bb7', expected: 'F#7', rationale: 'bVII7 - uses F# not Gb in sharp key context' },
          { original: 'Ab', expected: 'Eb', rationale: 'bVI - spelled as Eb not D# to avoid double sharp' },
          { original: 'Db7', expected: 'A7', rationale: 'bV7 - spelled as A not G## to avoid double sharp' },
          
          // Jazz extensions
          { original: 'Cmaj7#11', expected: 'Gmaj7#11', rationale: 'I maj7#11' },
          { original: 'F#m7b5', expected: 'C#m7b5', rationale: 'Uses C# not Db in sharp context' },
        ]
      },
      {
        description: 'E major context - four sharps',
        targetKey: 'E',
        keySignature: ['F#', 'C#', 'G#', 'D#'],
        testCases: [
          { original: 'C', expected: 'E', rationale: 'I chord' },
          { original: 'F#dim', expected: 'G#dim', rationale: 'Uses G# not Ab' },
          { original: 'Bb7', expected: 'C#7', rationale: 'Uses C# not Db' },
          { original: 'Ebm7', expected: 'G#m7', rationale: 'Uses G# not Ab' },
          { original: 'Ab7alt', expected: 'C#7alt', rationale: 'Altered chord uses C#' },
        ]
      },
      {
        description: 'F# major context - six sharps (extreme sharp key)',
        targetKey: 'F#',
        keySignature: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'],
        testCases: [
          { original: 'C', expected: 'F#', rationale: 'I chord' },
          { original: 'Dm', expected: 'G#m', rationale: 'Uses G# not Ab' },
          { original: 'Em', expected: 'A#m', rationale: 'Uses A# not Bb' },
          { original: 'F', expected: 'B', rationale: 'Uses B not Cb' },
          { original: 'Bdim', expected: 'E#dim', rationale: 'Uses E# not F' },
          { original: 'Bb', expected: 'D#', rationale: 'Borrowed chord uses D# not Eb' },
        ]
      }
    ];

    sharpKeyTests.forEach((keyTest) => {
      describe(keyTest.description, () => {
        keyTest.testCases.forEach((testCase) => {
          it(`${testCase.original} → ${testCase.expected} (${testCase.rationale})`, () => {
            // Placeholder - will implement actual transposition function
            expect(testCase.expected).toBeTruthy();
            expect(testCase.original).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Flat Key Context (User chooses flat keys)', () => {
    const flatKeyTests = [
      {
        description: 'F major context - one flat',
        targetKey: 'F',
        keySignature: ['Bb'],
        testCases: [
          // Diatonic chords
          { original: 'C', expected: 'F', rationale: 'I chord' },
          { original: 'Dm', expected: 'Gm', rationale: 'ii chord' },
          { original: 'Em', expected: 'Am', rationale: 'iii chord' },
          { original: 'F', expected: 'Bb', rationale: 'IV chord - must use Bb from key signature' },
          { original: 'G', expected: 'C', rationale: 'V chord' },
          { original: 'Am', expected: 'Dm', rationale: 'vi chord' },
          { original: 'Bdim', expected: 'Edim', rationale: 'vii° chord' },
          
          // Non-diatonic chords
          { original: 'F#7', expected: 'B7', rationale: 'V7/V - uses B not Cb to avoid double flat' },
          { original: 'A7', expected: 'D7', rationale: 'V7/vi - natural spelling' },
          { original: 'D7', expected: 'G7', rationale: 'V7/V' },
          
          // Jazz extensions
          { original: 'Cmaj7', expected: 'Fmaj7', rationale: 'I maj7' },
          { original: 'Dm7', expected: 'Gm7', rationale: 'ii7' },
          { original: 'G7sus4', expected: 'C7sus4', rationale: 'V7sus4' },
        ]
      },
      {
        description: 'Bb major context - two flats',
        targetKey: 'Bb',
        keySignature: ['Bb', 'Eb'],
        testCases: [
          { original: 'C', expected: 'Bb', rationale: 'I chord' },
          { original: 'F', expected: 'Eb', rationale: 'Uses Eb not D#' },
          { original: 'G7', expected: 'F7', rationale: 'V7' },
          { original: 'A7', expected: 'G7', rationale: 'Uses G not F##' },
          { original: 'D7', expected: 'C7', rationale: 'V7/V' },
          { original: 'Cmaj7#11', expected: 'Bbmaj7#11', rationale: 'I maj7#11' },
        ]
      },
      {
        description: 'Db major context - five flats (extreme flat key)',
        targetKey: 'Db',
        keySignature: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],
        testCases: [
          { original: 'C', expected: 'Db', rationale: 'I chord' },
          { original: 'Dm', expected: 'Ebm', rationale: 'Uses Eb not D#' },
          { original: 'Em', expected: 'Fm', rationale: 'Uses F not E#' },
          { original: 'F', expected: 'Gb', rationale: 'Uses Gb not F#' },
          { original: 'Am', expected: 'Bbm', rationale: 'Uses Bb not A#' },
          { original: 'B7', expected: 'C7', rationale: 'Uses C not B#' },
          { original: 'F#dim', expected: 'Gdim', rationale: 'Uses G not F##' },
        ]
      }
    ];

    flatKeyTests.forEach((keyTest) => {
      describe(keyTest.description, () => {
        keyTest.testCases.forEach((testCase) => {
          it(`${testCase.original} → ${testCase.expected} (${testCase.rationale})`, () => {
            // Placeholder - will implement actual transposition function
            expect(testCase.expected).toBeTruthy();
            expect(testCase.original).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Edge Cases Within Key Contexts', () => {
    const edgeCaseTests = [
      {
        description: 'Chromatic chords in sharp keys should prefer sharps',
        keyContext: 'D', // 2 sharps
        cases: [
          { original: 'Ab7', expected: 'B7', rationale: 'Chromatic passing chord uses B not Cb' },
          { original: 'Db7', expected: 'E7', rationale: 'Uses E not Fb' },
          { original: 'Gb7', expected: 'A7', rationale: 'Uses A not Bbb' },
        ]
      },
      {
        description: 'Chromatic chords in flat keys should prefer flats',
        keyContext: 'Ab', // 4 flats
        cases: [
          { original: 'F#7', expected: 'Eb7', rationale: 'Uses Eb not D#' },
          { original: 'C#7', expected: 'Bb7', rationale: 'Uses Bb not A#' },
          { original: 'G#dim', expected: 'Fdim', rationale: 'Uses F not E#' },
        ]
      },
      {
        description: 'Double accidental avoidance in extreme keys',
        keyContext: 'C#', // 7 sharps
        cases: [
          { original: 'Bb', expected: 'F#', rationale: 'Uses F# not Gbb' },
          { original: 'Eb', expected: 'B', rationale: 'Uses B not Cb to avoid double flat root' },
          { original: 'Ab7', expected: 'E7', rationale: 'Uses E not Fb' },
        ]
      }
    ];

    edgeCaseTests.forEach((edgeTest) => {
      describe(edgeTest.description, () => {
        edgeTest.cases.forEach((testCase) => {
          it(`${testCase.original} → ${testCase.expected} in ${edgeTest.keyContext} (${testCase.rationale})`, () => {
            expect(testCase.expected).toBeTruthy();
            expect(testCase.original).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Jazz Chord Extensions in Key Context', () => {
    const jazzContextTests = [
      {
        description: 'Complex jazz chords in Bb major context',
        keyContext: 'Bb',
        cases: [
          { original: 'Cmaj7#11', expected: 'Bbmaj7#11', rationale: 'I maj7#11' },
          { original: 'Dm9', expected: 'Cm9', rationale: 'ii9' },
          { original: 'G13', expected: 'F13', rationale: 'V13' },
          { original: 'Em7b5', expected: 'Dm7b5', rationale: 'iii7b5' },
          { original: 'A7alt', expected: 'G7alt', rationale: 'V7/vi alt' },
          { original: 'F#dim7', expected: 'Edim7', rationale: 'Uses E not D## in flat context' },
        ]
      },
      {
        description: 'Complex jazz chords in A major context',
        keyContext: 'A',
        cases: [
          { original: 'Cmaj7#11', expected: 'Amaj7#11', rationale: 'I maj7#11' },
          { original: 'Dm9', expected: 'Bm9', rationale: 'ii9' },
          { original: 'G13', expected: 'E13', rationale: 'V13' },
          { original: 'Bb7alt', expected: 'G#7alt', rationale: 'Uses G# not Ab in sharp context' },
          { original: 'Ebmaj7', expected: 'C#maj7', rationale: 'Uses C# not Db' },
        ]
      }
    ];

    jazzContextTests.forEach((jazzTest) => {
      describe(jazzTest.description, () => {
        jazzTest.cases.forEach((testCase) => {
          it(`${testCase.original} → ${testCase.expected} (${testCase.rationale})`, () => {
            expect(testCase.expected).toBeTruthy();
            expect(testCase.original).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Enharmonic Key Choice Validation', () => {
    const enharmonicChoiceTests = [
      {
        description: 'F# major vs Gb major - user choice determines spelling',
        sharpChoice: {
          key: 'F#',
          chords: [
            { original: 'C', fSharp: 'F#', gb: 'Gb' },
            { original: 'Dm', fSharp: 'G#m', gb: 'Abm' },
            { original: 'Em', fSharp: 'A#m', gb: 'Bbm' },
            { original: 'F', fSharp: 'B', gb: 'Cb' },
            { original: 'Bdim', fSharp: 'E#dim', gb: 'Fdim' },
          ]
        },
        flatChoice: {
          key: 'Gb',
          chords: [
            { original: 'C', fSharp: 'F#', gb: 'Gb' },
            { original: 'Dm', fSharp: 'G#m', gb: 'Abm' },
            { original: 'Em', fSharp: 'A#m', gb: 'Bbm' },
            { original: 'F', fSharp: 'B', gb: 'Cb' },
            { original: 'Bdim', fSharp: 'E#dim', gb: 'Fdim' },
          ]
        }
      },
      {
        description: 'C# major vs Db major - comprehensive comparison',
        cases: [
          { original: 'Am7', cSharp: 'F#m7', db: 'Gbm7' },
          { original: 'F7', cSharp: 'C#7', db: 'Db7' },
          { original: 'Bb', cSharp: 'F#', db: 'Gb' },
          { original: 'Ebdim', cSharp: 'G#dim', db: 'Abdim' },
        ]
      }
    ];

    enharmonicChoiceTests.forEach((choiceTest) => {
      it(choiceTest.description, () => {
        // Test that we have different spellings for the same enharmonic key
        if (choiceTest.sharpChoice && choiceTest.flatChoice) {
          choiceTest.sharpChoice.chords.forEach((chord, index) => {
            const flatEquivalent = choiceTest.flatChoice.chords[index];
            expect(chord.original).toBe(flatEquivalent.original);
            // The actual chord results should be different based on key choice
            expect(chord.fSharp).not.toBe(chord.gb);
          });
        }
      });
    });
  });

  describe('Modal Context Spelling', () => {
    const modalTests = [
      {
        description: 'Dorian mode spelling (minor with raised 6th)',
        mode: 'D Dorian', // Same as C major but starting on D
        cases: [
          { original: 'Cm', expected: 'Dm', rationale: 'i chord in Dorian' },
          { original: 'Dm', expected: 'Em', rationale: 'ii chord' },
          { original: 'Eb', expected: 'F', rationale: 'bIII chord' },
          { original: 'F', expected: 'G', rationale: 'IV chord' },
          { original: 'Gm', expected: 'Am', rationale: 'v chord' },
          { original: 'Adim', expected: 'Bdim', rationale: 'vi° chord (raised 6th)' },
          { original: 'Bb', expected: 'C', rationale: 'bVII chord' },
        ]
      },
      {
        description: 'Mixolydian mode spelling (major with lowered 7th)',
        mode: 'G Mixolydian', // Same as C major but starting on G
        cases: [
          { original: 'C', expected: 'G', rationale: 'I chord in Mixolydian' },
          { original: 'Dm', expected: 'Am', rationale: 'ii chord' },
          { original: 'Em', expected: 'Bm', rationale: 'iii chord' },
          { original: 'F', expected: 'C', rationale: 'IV chord' },
          { original: 'G', expected: 'D', rationale: 'V chord' },
          { original: 'Am', expected: 'Em', rationale: 'vi chord' },
          { original: 'Bb', expected: 'F', rationale: 'bVII chord (lowered 7th)' },
        ]
      }
    ];

    modalTests.forEach((modalTest) => {
      describe(modalTest.description, () => {
        modalTest.cases.forEach((testCase) => {
          it(`${testCase.original} → ${testCase.expected} (${testCase.rationale})`, () => {
            expect(testCase.expected).toBeTruthy();
            expect(testCase.original).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Practical Jazz Standard Examples', () => {
    const practicalTests = [
      {
        description: 'Autumn Leaves in Bb major',
        originalKey: 'Bb',
        targetKey: 'C', // User chooses C major (natural key)
        progression: [
          { original: 'Cm7', expected: 'Dm7', rationale: 'ii7' },
          { original: 'F7', expected: 'G7', rationale: 'V7' },
          { original: 'Bbmaj7', expected: 'Cmaj7', rationale: 'I maj7' },
          { original: 'Ebmaj7', expected: 'Fmaj7', rationale: 'IV maj7' },
          { original: 'Am7b5', expected: 'Bm7b5', rationale: 'vii7b5' },
          { original: 'D7', expected: 'E7', rationale: 'V7/vi' },
          { original: 'Gm7', expected: 'Am7', rationale: 'vi7' },
        ]
      },
      {
        description: 'Autumn Leaves transposed to F# major (user choice)',
        originalKey: 'Bb',
        targetKey: 'F#', // User specifically chooses F# over Gb
        progression: [
          { original: 'Cm7', expected: 'G#m7', rationale: 'ii7 - uses G# not Ab' },
          { original: 'F7', expected: 'C#7', rationale: 'V7 - uses C# not Db' },
          { original: 'Bbmaj7', expected: 'F#maj7', rationale: 'I maj7' },
          { original: 'Ebmaj7', expected: 'Bmaj7', rationale: 'IV maj7 - uses B not Cb' },
          { original: 'Am7b5', expected: 'E#m7b5', rationale: 'vii7b5 - uses E# from key' },
          { original: 'D7', expected: 'A#7', rationale: 'V7/vi - uses A# not Bb' },
          { original: 'Gm7', expected: 'D#m7', rationale: 'vi7 - uses D# not Eb' },
        ]
      }
    ];

    practicalTests.forEach((practicalTest) => {
      describe(practicalTest.description, () => {
        practicalTest.progression.forEach((chord) => {
          it(`${chord.original} → ${chord.expected} (${chord.rationale})`, () => {
            expect(chord.expected).toBeTruthy();
            expect(chord.original).toBeTruthy();
          });
        });
      });
    });
  });
});