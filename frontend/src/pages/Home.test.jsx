import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

let container = null;
let root = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
  root = null;
  // Clean up JSON-LD script tags added during tests
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
});

describe('Home page - JSON-LD structured data', () => {
  it('injects JSON-LD script tag with WebApplication schema into document head', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const data = JSON.parse(script.textContent);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebApplication');
    expect(data['name']).toBe('Veyfolio');
    expect(data['description']).toBe('AI-powered professional resume builder');
    expect(data['applicationCategory']).toBe('BusinessApplication');
    expect(container.querySelectorAll('a[href="/create"]').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector('a[href="#"]')).toBeNull();
  });

  it('removes JSON-LD script tag on unmount', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });

    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});

describe('Home page - Semantic HTML elements', () => {
  it('uses a header element', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    const header = container.querySelector('header');
    expect(header).not.toBeNull();
  });

  it('uses a nav element for navigation', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.querySelectorAll('a').length).toBeGreaterThan(0);
  });

  it('uses a main element wrapping content sections', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    const main = container.querySelector('main');
    expect(main).not.toBeNull();
    // Main should contain section elements
    const sections = main.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('uses section elements for content areas', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });

  it('uses a footer element', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
    });

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
  });
});
