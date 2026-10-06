import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

// Minimal render helpers so tests don't need @testing-library.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

export const render = (ui: ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
};

export const renderHook = <T,>(
  hook: () => T,
  wrapper?: (props: { children: ReactNode }) => ReactElement,
) => {
  const result = { current: undefined as T };
  const Probe = () => {
    result.current = hook();
    return null;
  };
  const Wrapper = wrapper;
  const rendered = render(
    Wrapper ? (
      <Wrapper>
        <Probe />
      </Wrapper>
    ) : (
      <Probe />
    ),
  );
  return { result, unmount: rendered.unmount };
};

export const waitFor = async (
  assertion: () => void,
  timeoutMs = 2000,
): Promise<void> => {
  const start = Date.now();
  for (;;) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - start > timeoutMs) throw error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }
};
