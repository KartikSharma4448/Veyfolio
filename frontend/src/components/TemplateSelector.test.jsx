import { createRoot } from 'react-dom/client';
import { act } from 'react';
import TemplateSelector, { TEMPLATES } from './TemplateSelector';

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
});

describe('TemplateSelector', () => {
  it('defines the two supported resume templates', () => {
    expect(TEMPLATES).toHaveLength(2);
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(['modern', 'clean']);
    TEMPLATES.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
    });
  });

  it('renders both templates as keyboard-accessible buttons', () => {
    act(() => {
      root.render(<TemplateSelector selected="modern" onSelect={() => {}} />);
    });
    TEMPLATES.forEach((t) => {
      expect(container.textContent).toContain(t.name);
      expect(container.textContent).toContain(t.description);
    });
    expect(container.querySelectorAll('button')).toHaveLength(2);
  });

  it('announces the selected template', () => {
    act(() => {
      root.render(<TemplateSelector selected="clean" onSelect={() => {}} />);
    });
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onSelect with the template id when a card is clicked', () => {
    const onSelect = jest.fn();
    act(() => {
      root.render(<TemplateSelector selected="modern" onSelect={onSelect} />);
    });
    const cards = container.querySelectorAll('button');

    act(() => {
      cards[1].click();
    });
    expect(onSelect).toHaveBeenCalledWith('clean');
  });
});
