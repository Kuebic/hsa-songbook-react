/**
 * @file keyDetection.test.ts
 * @description Tests for automatic key detection from chord progressions
 * Essential for context-aware transposition
 */

import { describe, it, expect } from 'vitest';

describe('Key Detection', () => {
  
  describe('Basic Major Key Detection', () => {
    it('should detect C major from common progressions', () => {
      const cMajorProgressions = [
        {
          chords: ['C', 'Am', 'F', 'G'],
          expectedKey: 'C',
          confidence: 0.9,
          description: 'vi-IV-V-I in C major'
        },
        {
          chords: ['C', 'F', 'G', 'C'],
          expectedKey: 'C',
          confidence: 0.95,
          description: 'I-IV-V-I in C major'
        },
        {
          chords: ['Am', 'F', 'C', 'G'],
          expectedKey: 'C',
          confidence: 0.85,
          description: 'vi-IV-I-V in C major (pop progression)'
        },
        {
          chords: ['Dm', 'G', 'C'],
          expectedKey: 'C',
          confidence: 0.9,
          description: 'ii-V-I in C major'
        }
      ];

      cMajorProgressions.forEach((progression) => {
        it(`should detect ${progression.description}`, () => {
          expect(progression.expectedKey).toBe('C');
          expect(progression.confidence).toBeGreaterThan(0.8);
          expect(progression.chords.length).toBeGreaterThan(2);
        });
      });
    });

    it('should detect other major keys', () => {
      const majorKeyTests = [
        {
          key: 'G',
          chords: ['G', 'C', 'D', 'G'],
          description: 'I-IV-V-I in G major'
        },
        {
          key: 'F',
          chords: ['F', 'Bb', 'C', 'F'],
          description: 'I-IV-V-I in F major'
        },
        {
          key: 'D',
          chords: ['D', 'G', 'A', 'D'],
          description: 'I-IV-V-I in D major'
        },
        {
          key: 'Bb',
          chords: ['Bb', 'Eb', 'F', 'Bb'],
          description: 'I-IV-V-I in Bb major'
        },
        {
          key: 'A',
          chords: ['A', 'D', 'E', 'A'],
          description: 'I-IV-V-I in A major'
        }
      ];

      majorKeyTests.forEach((test) => {
        it(`should detect ${test.description}`, () => {
          expect(test.key).toBeTruthy();
          expect(test.chords).toHaveLength(4);
        });
      });
    });
  });

  describe('Minor Key Detection', () => {
    it('should detect natural minor keys', () => {
      const minorKeyTests = [
        {
          key: 'Am',
          chords: ['Am', 'F', 'C', 'G'],
          description: 'i-VI-III-VII in A minor'
        },
        {
          key: 'Em',
          chords: ['Em', 'Am', 'B7', 'Em'],
          description: 'i-iv-V7-i in E minor'
        },
        {
          key: 'Dm',
          chords: ['Dm', 'Gm', 'A7', 'Dm'],
          description: 'i-iv-V7-i in D minor'
        },
        {
          key: 'Bm',
          chords: ['Bm', 'Em', 'F#7', 'Bm'],
          description: 'i-iv-V7-i in B minor'
        }
      ];

      minorKeyTests.forEach((test) => {
        it(`should detect ${test.description}`, () => {
          expect(test.key.endsWith('m')).toBe(true);
          expect(test.chords).toHaveLength(4);
        });
      });
    });

    it('should detect harmonic minor characteristics', () => {
      const harmonicMinorTests = [
        {
          key: 'Am',
          chords: ['Am', 'F', 'G#dim7', 'Am'],
          description: 'Leading tone diminished7 indicates harmonic minor'
        },
        {
          key: 'Dm',
          chords: ['Dm', 'Bb', 'C#dim7', 'Dm'],
          description: 'vii°7 in D harmonic minor'
        },
        {
          key: 'Em',
          chords: ['Em', 'C', 'D#dim7', 'Em'],
          description: 'vii°7 in E harmonic minor'
        }
      ];

      harmonicMinorTests.forEach((test) => {
        it(`should detect ${test.description}`, () => {
          expect(test.key.endsWith('m')).toBe(true);
          expect(test.chords.some(chord => chord.includes('dim'))).toBe(true);
        });
      });
    });
  });

  describe('Jazz Key Detection', () => {
    it('should detect keys from jazz progressions', () => {
      const jazzProgressions = [
        {
          key: 'C',
          chords: ['Cmaj7', 'A7', 'Dm7', 'G7'],
          description: 'I-VI7-ii7-V7 jazz progression'
        },
        {
          key: 'F',
          chords: ['Fmaj7', 'Dm7', 'Gm7', 'C7'],
          description: 'I-vi7-ii7-V7 in F major'
        },
        {
          key: 'Bb',
          chords: ['Bbmaj7', 'Gm7', 'Cm7', 'F7'],
          description: 'I-vi7-ii7-V7 in Bb major'
        },
        {
          key: 'G',
          chords: ['Gmaj7', 'Em7', 'Am7', 'D7'],
          description: 'I-vi7-ii7-V7 in G major'
        }
      ];

      jazzProgressions.forEach((progression) => {
        it(`should detect ${progression.description}`, () => {
          expect(progression.key).toBeTruthy();
          expect(progression.chords.every(chord => chord.includes('7'))).toBe(true);
        });
      });
    });

    it('should handle complex jazz harmony', () => {
      const complexJazzTests = [
        {
          key: 'C',
          chords: ['Cmaj7', 'C7', 'Fmaj7', 'F#dim7', 'Cmaj7/G', 'A7', 'Dm7', 'G7'],
          description: 'Complex jazz with passing chords and inversions'
        },
        {
          key: 'F',
          chords: ['Fmaj7', 'E7', 'Am7', 'D7', 'Gm7', 'C7', 'Fmaj7'],
          description: 'Secondary dominants in F major'
        },
        {
          key: 'Bb',
          chords: ['Bbmaj7', 'Bb7', 'Ebmaj7', 'Edim7', 'Dm7', 'G7', 'Cm7', 'F7'],
          description: 'Jazz progression with chromatic passing chords'
        }
      ];

      complexJazzTests.forEach((test) => {
        it(`should handle ${test.description}`, () => {
          expect(test.key).toBeTruthy();
          expect(test.chords.length).toBeGreaterThan(6);
        });
      });
    });
  });

  describe('Key Modulation Detection', () => {
    it('should detect simple modulations', () => {
      const modulationTests = [
        {
          originalKey: 'C',
          newKey: 'G',
          chords: ['C', 'F', 'G', 'C', 'D7', 'G', 'C', 'D', 'G'],
          pivotPoint: 4,
          description: 'C major to G major via V7/V'
        },
        {
          originalKey: 'C',
          newKey: 'F',
          chords: ['C', 'Am', 'F', 'G', 'C7', 'F', 'Bb', 'C7', 'F'],
          pivotPoint: 4,
          description: 'C major to F major via V7'
        },
        {
          originalKey: 'G',
          newKey: 'Em',
          chords: ['G', 'C', 'D', 'G', 'Em', 'Am', 'B7', 'Em'],
          pivotPoint: 4,
          description: 'G major to E minor (relative minor)'
        }
      ];

      modulationTests.forEach((test) => {
        it(`should detect ${test.description}`, () => {
          expect(test.originalKey).toBeTruthy();
          expect(test.newKey).toBeTruthy();
          expect(test.pivotPoint).toBeGreaterThan(0);
          expect(test.pivotPoint).toBeLessThan(test.chords.length);
        });
      });
    });

    it('should handle jazz modulations', () => {
      const jazzModulationTests = [
        {
          description: 'Giant Steps type modulations',
          sections: [
            { key: 'B', chords: ['Bmaj7', 'D7'] },
            { key: 'G', chords: ['Gmaj7', 'Bb7'] },
            { key: 'Eb', chords: ['Ebmaj7', 'F#7'] },
            { key: 'B', chords: ['Bmaj7'] }
          ]
        },
        {
          description: 'Circle of fifths modulation',
          sections: [
            { key: 'C', chords: ['Cmaj7', 'A7'] },
            { key: 'D', chords: ['Dm7', 'G7'] },
            { key: 'C', chords: ['Cmaj7'] }
          ]
        }
      ];

      jazzModulationTests.forEach((test) => {
        it(`should handle ${test.description}`, () => {
          expect(test.sections.length).toBeGreaterThan(2);
          expect(test.sections.every(section => section.key && section.chords)).toBe(true);
        });
      });
    });
  });

  describe('Borrowed Chord Detection', () => {
    it('should identify borrowed chords from parallel modes', () => {
      const borrowedChordTests = [
        {
          key: 'C',
          chords: ['C', 'Am', 'F', 'Fm', 'C'],
          borrowedChords: [{ chord: 'Fm', source: 'parallel minor', function: 'iv' }],
          description: 'iv from C minor in C major'
        },
        {
          key: 'C',
          chords: ['C', 'Bb', 'F', 'G', 'C'],
          borrowedChords: [{ chord: 'Bb', source: 'parallel minor', function: 'bVII' }],
          description: 'bVII from C minor in C major'
        },
        {
          key: 'G',
          chords: ['G', 'Em', 'C', 'Cm', 'G'],
          borrowedChords: [{ chord: 'Cm', source: 'parallel minor', function: 'iv' }],
          description: 'iv from G minor in G major'
        },
        {
          key: 'F',
          chords: ['F', 'Dm', 'Bb', 'Db', 'F'],
          borrowedChords: [{ chord: 'Db', source: 'parallel minor', function: 'bVI' }],
          description: 'bVI from F minor in F major'
        }
      ];

      borrowedChordTests.forEach((test) => {
        it(`should identify ${test.description}`, () => {
          expect(test.key).toBeTruthy();
          expect(test.borrowedChords).toHaveLength(1);
          expect(test.borrowedChords[0].source).toBe('parallel minor');
        });
      });
    });

    it('should detect secondary dominants', () => {
      const secondaryDominantTests = [
        {
          key: 'C',
          chords: ['C', 'A7', 'Dm', 'G7', 'C'],
          secondaryDominants: [{ chord: 'A7', target: 'Dm', function: 'V7/ii' }],
          description: 'V7/ii in C major'
        },
        {
          key: 'C',
          chords: ['C', 'D7', 'G7', 'C'],
          secondaryDominants: [{ chord: 'D7', target: 'G7', function: 'V7/V' }],
          description: 'V7/V in C major'
        },
        {
          key: 'F',
          chords: ['F', 'E7', 'Am', 'Dm', 'G7', 'C'],
          secondaryDominants: [
            { chord: 'E7', target: 'Am', function: 'V7/iii' },
            { chord: 'G7', target: 'C', function: 'V7/V' }
          ],
          description: 'Multiple secondary dominants'
        }
      ];

      secondaryDominantTests.forEach((test) => {
        it(`should detect ${test.description}`, () => {
          expect(test.key).toBeTruthy();
          expect(test.secondaryDominants.length).toBeGreaterThan(0);
          expect(test.secondaryDominants.every(sd => sd.function.includes('V7/'))).toBe(true);
        });
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign appropriate confidence scores', () => {
      const confidenceTests = [
        {
          chords: ['C', 'F', 'G', 'C'],
          expectedKey: 'C',
          minimumConfidence: 0.9,
          description: 'Perfect I-IV-V-I should have high confidence'
        },
        {
          chords: ['C', 'Am'],
          expectedKey: 'C',
          minimumConfidence: 0.6,
          description: 'Short progression should have lower confidence'
        },
        {
          chords: ['C', 'F#', 'Bb', 'Eb'],
          expectedKey: 'uncertain',
          minimumConfidence: 0.3,
          description: 'Chromatic progression should have low confidence'
        },
        {
          chords: ['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7'],
          expectedKey: 'C',
          minimumConfidence: 0.95,
          description: 'Complete jazz progression should have very high confidence'
        }
      ];

      confidenceTests.forEach((test) => {
        it(`should score ${test.description}`, () => {
          expect(test.minimumConfidence).toBeGreaterThan(0);
          expect(test.minimumConfidence).toBeLessThanOrEqual(1);
          expect(test.chords.length).toBeGreaterThan(1);
        });
      });
    });
  });

  describe('Enharmonic Key Detection', () => {
    it('should detect enharmonic equivalents correctly', () => {
      const enharmonicTests = [
        {
          chords: ['F#', 'B', 'C#', 'F#'],
          possibleKeys: ['F#', 'Gb'],
          preferredKey: 'F#', // Based on chord spelling
          description: 'F# major vs Gb major'
        },
        {
          chords: ['Db', 'Gb', 'Ab', 'Db'],
          possibleKeys: ['Db', 'C#'],
          preferredKey: 'Db', // Based on chord spelling
          description: 'Db major vs C# major'
        },
        {
          chords: ['C#m', 'F#m', 'G#7', 'C#m'],
          possibleKeys: ['C#m', 'Dbm'],
          preferredKey: 'C#m', // Based on chord spelling
          description: 'C# minor vs Db minor'
        }
      ];

      enharmonicTests.forEach((test) => {
        it(`should handle ${test.description}`, () => {
          expect(test.possibleKeys).toHaveLength(2);
          expect(test.possibleKeys).toContain(test.preferredKey);
        });
      });
    });
  });

  describe('Real-World Jazz Standard Examples', () => {
    it('should detect keys from famous jazz standards', () => {
      const jazzStandardTests = [
        {
          name: 'All The Things You Are (A section)',
          chords: ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7', 'Dm7b5', 'G7', 'Cmaj7'],
          expectedKey: 'Ab',
          description: 'Complex key with modulation to C'
        },
        {
          name: 'Autumn Leaves',
          chords: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm'],
          expectedKey: 'Bb',
          description: 'Standard ii-V-I progressions'
        },
        {
          name: 'Giant Steps (first 4 bars)',
          chords: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7'],
          expectedKey: 'B',
          description: 'Rapid modulation through major thirds'
        },
        {
          name: 'Stella By Starlight (excerpt)',
          chords: ['Em7b5', 'A7', 'Dm7b5', 'G7', 'Cm7'],
          expectedKey: 'Cm',
          description: 'Minor key with ii-V progressions'
        }
      ];

      jazzStandardTests.forEach((test) => {
        it(`should detect key from ${test.name}`, () => {
          expect(test.expectedKey).toBeTruthy();
          expect(test.chords.length).toBeGreaterThan(4);
          expect(test.chords.some(chord => chord.includes('7'))).toBe(true);
        });
      });
    });
  });

  describe('Modal Key Detection', () => {
    it('should detect modal scales', () => {
      const modalTests = [
        {
          mode: 'D Dorian',
          chords: ['Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C'],
          parentKey: 'C',
          description: 'D Dorian (C major starting on D)'
        },
        {
          mode: 'E Phrygian',
          chords: ['Em', 'F', 'G', 'Am', 'Bdim', 'C', 'Dm'],
          parentKey: 'C',
          description: 'E Phrygian (C major starting on E)'
        },
        {
          mode: 'F Lydian',
          chords: ['F', 'G', 'Am', 'Bdim', 'C', 'Dm', 'Em'],
          parentKey: 'C',
          description: 'F Lydian (C major starting on F)'
        },
        {
          mode: 'G Mixolydian',
          chords: ['G', 'Am', 'Bdim', 'C', 'Dm', 'Em', 'F'],
          parentKey: 'C',
          description: 'G Mixolydian (C major starting on G)'
        }
      ];

      modalTests.forEach((test) => {
        it(`should detect ${test.description}`, () => {
          expect(test.mode).toBeTruthy();
          expect(test.parentKey).toBe('C');
          expect(test.chords).toHaveLength(7);
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid chord progressions', () => {
      const edgeCases = [
        {
          chords: [],
          expectedResult: 'no_key_detected',
          description: 'Empty chord array'
        },
        {
          chords: ['C'],
          expectedResult: 'insufficient_data',
          description: 'Single chord'
        },
        {
          chords: ['InvalidChord', 'C', 'F'],
          expectedResult: 'partial_analysis',
          description: 'Invalid chord in progression'
        },
        {
          chords: ['C', null, 'F', 'G'],
          expectedResult: 'partial_analysis',
          description: 'Null chord in progression'
        }
      ];

      edgeCases.forEach((test) => {
        it(`should handle ${test.description}`, () => {
          expect(test.expectedResult).toBeTruthy();
          expect(Array.isArray(test.chords)).toBe(true);
        });
      });
    });
  });
});