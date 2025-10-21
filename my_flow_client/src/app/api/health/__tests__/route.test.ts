import { GET } from '../route';

describe('GET /api/health', () => {
  it('should return 200 status with ok message', async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ status: 'ok' });
  });

  it('should return valid JSON response', async () => {
    const response = await GET();

    const data = await response.json();
    expect(typeof data).toBe('object');
    expect(data.status).toBeDefined();
  });
});
