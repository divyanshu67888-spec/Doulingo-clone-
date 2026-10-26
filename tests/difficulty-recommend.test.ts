import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { POST } from '../src/app/api/difficulty/recommend/route';
import { prisma } from '../src/lib/db';
import * as auth from '../src/lib/auth';

describe('Difficulty Recommendation API Route', () => {
  let testUserId: string;
  let testUnitId: string;

  beforeAll(async () => {
    // Setup test user and unit
    const user = await prisma.user.create({
      data: {
        email: `recommender_test_${Date.now()}@linguaquest.test`,
        passwordHash: 'dummy_hash',
        displayName: 'RecommenderUser',
        timeZone: 'UTC',
        language: 'es',
      },
    });
    testUserId = user.id;

    const unit = await prisma.unit.findFirstOrThrow({
      where: { language: 'es', key: 'greetings' },
    });
    testUnitId = unit.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Mock user authentication
    vi.spyOn(auth, 'getCurrentUserId').mockResolvedValue(testUserId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('returns 400 if unitId is missing', async () => {
      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('returns 400 if accuracy is out of bounds (< 0 or > 1)', async () => {
      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: testUnitId, accuracy: 1.5 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 if avg_response_time_sec is non-positive', async () => {
      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: testUnitId, avg_response_time_sec: 0 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 if previous_attempts is negative', async () => {
      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: testUnitId, previous_attempts: -1 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('Fallback Behavior When ML Service is Down or Errors', () => {
    it('returns { available: false } gracefully when fetch throws network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED: Connection refused'));

      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: testUnitId }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ available: false });
    });

    it('returns { available: false } when ML service returns 500 error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Internal model error' }), { status: 500 })
      );

      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: testUnitId }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ available: false });
    });
  });

  describe('Successful ML Recommendation', () => {
    it('returns mapped difficulty and synthetic_model flag when ML service succeeds', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            recommended_difficulty: 'Medium',
            probabilities: { Easy: 0.15, Medium: 0.75, Hard: 0.1 },
            synthetic_model: true,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('http://localhost:3000/api/difficulty/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: testUnitId }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.available).toBe(true);
      expect(data.recommendedDifficulty).toBe('medium');
      expect(data.modelRecommendation).toBe('Medium');
      expect(data.syntheticModel).toBe(true);
      expect(data.probabilities.Medium).toBe(0.75);
      expect(data.featuresUsed).toBeDefined();
      expect(data.featuresUsed.topic).toBe('Greetings');
    });
  });
});
