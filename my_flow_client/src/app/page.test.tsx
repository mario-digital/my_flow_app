/**
 * Unit tests for home page component.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home Page', () => {
  it('renders the page without crashing', () => {
    render(<Home />);
    expect(() => screen.getByRole('main')).not.toThrow();
  });

  it('contains the Next.js logo', () => {
    render(<Home />);
    const logo = screen.getByRole('img', { name: /next\.js logo/i });
    expect(logo).toBeInstanceOf(HTMLImageElement);
  });

  it('contains navigation links', () => {
    render(<Home />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
