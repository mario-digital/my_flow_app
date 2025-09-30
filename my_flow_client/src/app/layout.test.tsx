/**
 * Unit tests for root layout component.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RootLayout from './layout';

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInstanceOf(HTMLElement);
    expect(screen.getByText('Test Content')).toBeInstanceOf(HTMLElement);
  });

  it('renders as a function component', () => {
    const result = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    expect(result.container).toBeDefined();
  });

  it('accepts React node children', () => {
    const { getByText } = render(
      <RootLayout>
        <main>
          <h1>Main Content</h1>
          <p>Paragraph</p>
        </main>
      </RootLayout>
    );

    expect(getByText('Main Content')).toBeInstanceOf(HTMLElement);
    expect(getByText('Paragraph')).toBeInstanceOf(HTMLElement);
  });
});
