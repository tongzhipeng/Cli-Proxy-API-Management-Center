import { describe, expect, test } from 'bun:test';
import { createElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse as parseYaml } from 'yaml';
import { parseRoutingStrategy, useVisualConfig } from '../src/hooks/useVisualConfig';

describe('visual config routing strategies', () => {
  test('recognizes the weighted-round-robin backend value', () => {
    expect(parseRoutingStrategy('weighted-round-robin')).toBe('weighted-round-robin');
    expect(parseRoutingStrategy('weightedroundrobin')).toBe('weighted-round-robin');
    expect(parseRoutingStrategy('wrr')).toBe('weighted-round-robin');
    expect(parseRoutingStrategy('fill-first')).toBe('fill-first');
    expect(parseRoutingStrategy('fillfirst')).toBe('fill-first');
    expect(parseRoutingStrategy('ff')).toBe('fill-first');
    expect(parseRoutingStrategy(undefined)).toBe('round-robin');
  });

  test('recognizes quota reset aliases without falling back to round-robin', () => {
    for (const value of ['quota-reset-first', 'quotaresetfirst', 'reset-first', 'qrf', ' QRF ']) {
      expect(parseRoutingStrategy(value)).toBe('quota-reset-first');
    }
  });

  for (const strategy of ['weighted-round-robin', 'quota-reset-first'] as const) {
    test(`writes ${strategy} without coercing it to round-robin`, () => {
      function Harness() {
        const visualConfig = useVisualConfig();
        const [phase, setPhase] = useState(0);

        if (phase === 0) {
          visualConfig.setVisualValues({ routingStrategy: strategy });
          setPhase(1);
        } else {
          return createElement(
            'pre',
            null,
            visualConfig.applyVisualChangesToYaml('routing:\n  strategy: round-robin\n')
          );
        }

        return null;
      }

      const markup = renderToStaticMarkup(createElement(Harness));
      const result = markup.slice('<pre>'.length, -'</pre>'.length);

      expect(parseYaml(result)).toEqual({ routing: { strategy } });
    });
  }
});
