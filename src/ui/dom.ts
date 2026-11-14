type AttrValue = string | number | boolean | EventListener | null | undefined
export type Attrs = Readonly<Record<string, AttrValue>>
export type Child = Node | string | null | false | undefined

const SVG_NS = 'http://www.w3.org/2000/svg'

function applyAttrs(el: Element, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'boolean' && /^(aria|data)-/.test(key)) {
      el.setAttribute(key, String(value))
      continue
    }
    if (value === null || value === undefined || value === false) continue
    if (typeof value === 'function') {
      el.addEventListener(key.replace(/^on/, ''), value)
    } else {
      el.setAttribute(key, value === true ? '' : String(value))
    }
  }
}

function appendChildren(el: Element, children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    el.append(child)
  }
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: readonly Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  applyAttrs(el, attrs)
  appendChildren(el, children)
  return el
}

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: readonly Child[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag)
  applyAttrs(el, attrs)
  appendChildren(el, children)
  return el
}
