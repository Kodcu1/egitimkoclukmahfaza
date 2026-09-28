/**
 * Utility to sanitize cloned DOM and prevent html2canvas "oklch" color parsing errors.
 * Modern browsers & Tailwind CSS v4 output oklch() color functions which crash html2canvas:
 * "Attempting to parse an unsupported color function 'oklch'".
 */

let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

export function safeColorToRgb(colorStr: string, fallback: string = '#111827'): string {
  if (!colorStr) return fallback;
  if (!colorStr.includes('oklch') && !colorStr.includes('color(') && !colorStr.includes('lab(')) {
    return colorStr;
  }

  try {
    if (typeof document !== 'undefined') {
      if (!helperCanvas) {
        helperCanvas = document.createElement('canvas');
        helperCanvas.width = 1;
        helperCanvas.height = 1;
        helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
      }
      if (helperCtx) {
        helperCtx.fillStyle = '#ffffff';
        helperCtx.fillStyle = colorStr;
        const res = helperCtx.fillStyle;
        if (res && !res.includes('oklch') && !res.includes('color(')) {
          return res;
        }
      }
    }
  } catch (e) {
    // Ignore canvas parse errors and fall back to safe color
  }

  return fallback;
}

export function sanitizeClonedDocForHtml2Canvas(clonedDoc: Document): void {
  try {
    const win = clonedDoc.defaultView || window;

    // 1. Sanitize all <style> tags in cloned document to neutralize oklch occurrences
    clonedDoc.querySelectorAll('style').forEach((styleEl) => {
      try {
        if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
          styleEl.textContent = styleEl.textContent.replace(
            /oklch\([^)]+\)/gi,
            '#111827'
          );
        }
      } catch (e) {
        // ignore style tag modification errors
      }
    });

    // 2. Sanitize all inline styles on cloned elements
    clonedDoc.querySelectorAll('*').forEach((node) => {
      const el = node as HTMLElement;
      if (
        el.style &&
        el.style.cssText &&
        (el.style.cssText.includes('oklch') || el.style.cssText.includes('color('))
      ) {
        el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/gi, '#111827');
      }
    });

    // 3. Patch getComputedStyle on the cloned window context
    const origGetComputedStyle = win.getComputedStyle.bind(win);

    win.getComputedStyle = (el: Element, pseudo?: string | null): CSSStyleDeclaration => {
      const origStyle = origGetComputedStyle(el, pseudo);

      return new Proxy(origStyle, {
        get(target, prop: string | symbol) {
          if (typeof prop !== 'string') {
            return (target as any)[prop];
          }

          // Intercept getPropertyValue method! This is what html2canvas calls most often.
          if (prop === 'getPropertyValue') {
            return (propertyName: string): string => {
              const raw = target.getPropertyValue(propertyName);
              if (
                typeof raw === 'string' &&
                (raw.includes('oklch') || raw.includes('color(') || raw.includes('lab('))
              ) {
                if (propertyName.includes('background')) {
                  return safeColorToRgb(raw, '#ffffff');
                }
                if (propertyName.includes('border') || propertyName.includes('rule')) {
                  return safeColorToRgb(raw, '#e2e8f0');
                }
                if (propertyName.includes('shadow')) {
                  return 'none';
                }
                if (propertyName.includes('outline')) {
                  return 'transparent';
                }
                if (
                  propertyName === 'color' ||
                  propertyName.includes('fill') ||
                  propertyName.includes('stroke')
                ) {
                  return safeColorToRgb(raw, '#111827');
                }
                return safeColorToRgb(raw, '#111827');
              }
              return raw;
            };
          }

          // Intercept direct property access (e.g. style.backgroundColor, style.color)
          const val = (target as any)[prop];
          if (
            typeof val === 'string' &&
            (val.includes('oklch') || val.includes('color(') || val.includes('lab('))
          ) {
            if (prop === 'backgroundColor' || prop === 'background') {
              return safeColorToRgb(val, '#ffffff');
            }
            if (
              prop.includes('Color') ||
              prop === 'borderColor' ||
              prop.includes('border')
            ) {
              return safeColorToRgb(val, '#e2e8f0');
            }
            if (prop === 'color' || prop === 'fill') {
              return safeColorToRgb(val, '#111827');
            }
            if (prop === 'boxShadow' || prop === 'textShadow') {
              return 'none';
            }
            if (prop === 'outline' || prop === 'outlineColor') {
              return 'transparent';
            }
            return safeColorToRgb(val, '#111827');
          }

          if (typeof val === 'function') {
            return val.bind(target);
          }

          return val;
        },
      });
    };
  } catch (err) {
    console.warn('DOM sanitization for html2canvas encountered an error:', err);
  }
}
