import { describe, expect, it } from 'vitest';

import { cosineSimilarity, textToVector } from '../storage';

describe('Vector Operations', () => {
  describe('textToVector', () => {
    it('should convert text to fixed-dimension vector', () => {
      const text = 'hello';
      const dimensions = 128;
      const vector = textToVector(text, dimensions);

      expect(vector).toHaveLength(dimensions);
      expect(vector.every(v => v >= 0 && v <= 1)).toBe(true);
    });

    it('should handle empty text', () => {
      const vector = textToVector('', 128);
      expect(vector.every(v => v === 0)).toBe(true);
    });

    it('should handle text longer than dimensions', () => {
      const longText = 'a'.repeat(200);
      const dimensions = 128;
      const vector = textToVector(longText, dimensions);

      expect(vector).toHaveLength(dimensions);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate similarity between vectors', () => {
      const a = [1, 0, 1];
      const b = [1, 0, 1];
      const similarity = cosineSimilarity(a, b);
      // Use toBeCloseTo with high precision for floating-point comparison
      expect(similarity).toBeCloseTo(1, 10);
    });

    it('should handle orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });

    it('should handle vectors of different lengths', () => {
      const a = [1, 0, 1];
      const b = [1, 0];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });

    it('should handle zero vectors', () => {
      const a = [0, 0, 0];
      const b = [1, 1, 1];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });
  });
});
