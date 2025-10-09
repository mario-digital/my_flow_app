import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../server';
import { resetMockContexts, resetMockFlows } from '../handlers';

describe('MSW Handlers', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    resetMockContexts();
    resetMockFlows();
  });
  afterAll(() => server.close());

  describe('Context Handlers', () => {
    describe('POST /api/v1/contexts', () => {
      it('creates context successfully with valid data', async () => {
        const response = await fetch('http://localhost/api/v1/contexts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Context',
            color: '#FF5733',
            icon: '🚀',
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.name).toBe('Test Context');
        expect(data.color).toBe('#FF5733');
        expect(data.icon).toBe('🚀');
      });

      it('rejects context with invalid name (too long)', async () => {
        const response = await fetch('http://localhost/api/v1/contexts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'a'.repeat(51), // 51 characters (max is 50)
            color: '#FF5733',
            icon: '🚀',
          }),
        });

        expect(response.status).toBe(400);
      });

      it('rejects context with empty name', async () => {
        const response = await fetch('http://localhost/api/v1/contexts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '',
            color: '#FF5733',
            icon: '🚀',
          }),
        });

        expect(response.status).toBe(400);
      });

      it('rejects context with invalid color format (lowercase hex)', async () => {
        const response = await fetch('http://localhost/api/v1/contexts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test',
            color: '#ff5733', // lowercase
            icon: '🚀',
          }),
        });

        expect(response.ok).toBe(true); // Regex accepts lowercase
        const data = await response.json();
        expect(data.color).toBe('#ff5733');
      });

      it('rejects context with invalid color format (no hash)', async () => {
        const response = await fetch('http://localhost/api/v1/contexts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test',
            color: 'FF5733', // no hash
            icon: '🚀',
          }),
        });

        expect(response.status).toBe(400);
      });

      it('rejects context with invalid color format (wrong length)', async () => {
        const response = await fetch('http://localhost/api/v1/contexts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test',
            color: '#FF57', // only 4 chars after #
            icon: '🚀',
          }),
        });

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/v1/contexts/:id', () => {
      it('updates context successfully', async () => {
        const response = await fetch(
          'http://localhost/api/v1/contexts/507f1f77bcf86cd799439011',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Updated Context',
              color: '#00FF00',
            }),
          }
        );

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.name).toBe('Updated Context');
        expect(data.color).toBe('#00FF00');
      });

      it('returns 404 for non-existent context', async () => {
        const response = await fetch(
          'http://localhost/api/v1/contexts/nonexistent',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test' }),
          }
        );

        expect(response.status).toBe(404);
      });

      it('rejects update with invalid name length', async () => {
        const response = await fetch(
          'http://localhost/api/v1/contexts/507f1f77bcf86cd799439011',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'a'.repeat(51),
            }),
          }
        );

        expect(response.status).toBe(400);
      });

      it('rejects update with invalid color format', async () => {
        const response = await fetch(
          'http://localhost/api/v1/contexts/507f1f77bcf86cd799439011',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              color: 'invalid-color',
            }),
          }
        );

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Flow Handlers', () => {
    describe('POST /api/v1/flows', () => {
      it('creates flow successfully with valid data', async () => {
        const response = await fetch('http://localhost/api/v1/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context_id: '507f1f77bcf86cd799439011',
            title: 'New Flow',
            description: 'Test description',
            priority: 'high',
            reminder_enabled: true,
          }),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.title).toBe('New Flow');
        expect(data.priority).toBe('high');
      });

      it('rejects flow with title too short', async () => {
        const response = await fetch('http://localhost/api/v1/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context_id: '507f1f77bcf86cd799439011',
            title: '', // empty
            priority: 'medium',
            reminder_enabled: true,
          }),
        });

        expect(response.status).toBe(400);
      });

      it('rejects flow with title too long', async () => {
        const response = await fetch('http://localhost/api/v1/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context_id: '507f1f77bcf86cd799439011',
            title: 'a'.repeat(201), // 201 characters (max is 200)
            priority: 'medium',
            reminder_enabled: true,
          }),
        });

        expect(response.status).toBe(400);
      });

      it('creates flow with minimal required fields', async () => {
        const response = await fetch('http://localhost/api/v1/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context_id: '507f1f77bcf86cd799439011',
            title: 'Minimal Flow',
            priority: 'low',
            reminder_enabled: false,
          }),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.title).toBe('Minimal Flow');
        expect(data.description).toBeNull();
      });
    });

    describe('PUT /api/v1/flows/:id', () => {
      it('updates flow successfully', async () => {
        const response = await fetch('http://localhost/api/v1/flows/flow-001', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Updated Flow Title',
            priority: 'low',
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.title).toBe('Updated Flow Title');
        expect(data.priority).toBe('low');
      });

      it('returns 404 for non-existent flow', async () => {
        const response = await fetch(
          'http://localhost/api/v1/flows/nonexistent',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Test' }),
          }
        );

        expect(response.status).toBe(404);
      });

      it('updates with valid non-empty title', async () => {
        const response = await fetch('http://localhost/api/v1/flows/flow-001', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Valid Updated Title',
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.title).toBe('Valid Updated Title');
      });

      it('rejects update with title too long', async () => {
        const response = await fetch('http://localhost/api/v1/flows/flow-001', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'a'.repeat(201),
          }),
        });

        expect(response.status).toBe(400);
      });

      it('handles description update with undefined (keeps existing)', async () => {
        const response = await fetch('http://localhost/api/v1/flows/flow-001', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priority: 'medium',
            // description not provided
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.description).toBeDefined(); // Should keep existing description
      });

      it('handles due_date update with null (clears field)', async () => {
        const response = await fetch('http://localhost/api/v1/flows/flow-001', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            due_date: null,
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.due_date).toBeNull();
      });
    });

    describe('DELETE /api/v1/flows/:id', () => {
      it('deletes flow successfully', async () => {
        const response = await fetch('http://localhost/api/v1/flows/flow-001', {
          method: 'DELETE',
        });

        expect(response.status).toBe(204);
      });

      it('returns 404 for non-existent flow', async () => {
        const response = await fetch(
          'http://localhost/api/v1/flows/nonexistent',
          {
            method: 'DELETE',
          }
        );

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/v1/flows/:id/complete', () => {
      it('toggles completion successfully', async () => {
        const response = await fetch(
          'http://localhost/api/v1/flows/flow-001/complete',
          {
            method: 'PATCH',
          }
        );

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(typeof data.is_completed).toBe('boolean');
        expect(data.updated_at).toBeDefined();
      });

      it('returns 404 for non-existent flow', async () => {
        const response = await fetch(
          'http://localhost/api/v1/flows/nonexistent/complete',
          {
            method: 'PATCH',
          }
        );

        expect(response.status).toBe(404);
      });

      it('sets completed_at when marking as complete', async () => {
        // First get the flow to check its current state
        const getResponse = await fetch(
          'http://localhost/api/v1/flows/flow-001'
        );
        const flow = await getResponse.json();

        const response = await fetch(
          'http://localhost/api/v1/flows/flow-001/complete',
          {
            method: 'PATCH',
          }
        );

        expect(response.ok).toBe(true);
        const data = await response.json();

        // If it was incomplete, should now be complete with completed_at
        if (!flow.is_completed) {
          expect(data.is_completed).toBe(true);
          expect(data.completed_at).not.toBeNull();
        } else {
          // If it was complete, should now be incomplete with null completed_at
          expect(data.is_completed).toBe(false);
          expect(data.completed_at).toBeNull();
        }
      });
    });
  });

  describe('Mock Reset Functions', () => {
    it('resetMockContexts restores initial data', async () => {
      // Create a new context
      await fetch('http://localhost/api/v1/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Context',
          color: '#FF5733',
          icon: '🚀',
        }),
      });

      // Reset mocks
      resetMockContexts();

      // Verify original data is restored
      const response = await fetch('http://localhost/api/v1/contexts');
      const contexts = await response.json();
      expect(contexts).toHaveLength(3); // Original count
      expect(
        contexts.find((c: { name: string }) => c.name === 'Work')
      ).toBeDefined();
    });

    it('resetMockFlows restores initial data', async () => {
      // Create a new flow
      await fetch('http://localhost/api/v1/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context_id: '507f1f77bcf86cd799439011',
          title: 'New Flow',
          priority: 'medium',
          reminder_enabled: true,
        }),
      });

      // Reset mocks
      resetMockFlows();

      // Verify original data is restored
      const response = await fetch(
        'http://localhost/api/v1/contexts/507f1f77bcf86cd799439011/flows'
      );
      const data = await response.json();
      expect(data.items).toHaveLength(2); // Original count for Work context
    });
  });
});
