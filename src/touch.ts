import { trackViewport } from './utils'

type Dir = 'left' | 'right' | 'up' | 'down'
type InputName = Dir | 'a' | 'b'

const VIBRATE_MS = 150
const CONTROLS_MIN_FRACTION = 0.3

const DPAD = { cx: 0.25, cy: 0.42, size: 0.52, thickness: 0.18 }
const BUTTONS = {
  a: { cx: 0.85, cy: 0.24, d: 0.28 },
  b: { cx: 0.64, cy: 0.52, d: 0.28 },
}
const TOUCH_SLOP = 1.6

const LINE = '#4c4c4c'
const LINE_ACTIVE = '#b4b4b4'
const FILL_ACTIVE = 'rgba(255,255,255,0.08)'

const DIRS: Record<Dir, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
}
const UNDO = { key: 'space', code: 'KeySpace', keyCode: 32 }
const KEY_FOR: Record<
  InputName,
  { key: string; code: string; keyCode: number }
> = {
  left: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  up: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  down: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  a: UNDO,
  b: UNDO,
}

function touchEnabled() {
  const qs = new URLSearchParams(location.search)
  if (qs.has('touch')) return qs.get('touch') !== '0'
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
}

const SVG_NS = 'http://www.w3.org/2000/svg'
function el<K extends keyof SVGElementTagNameMap>(name: K) {
  return document.createElementNS(SVG_NS, name)
}

const polygon = (points: [number, number][]) =>
  points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ') + 'Z'

export function setupTouchControls() {
  if (!touchEnabled()) return false

  document.body.classList.add('touch')
  trackViewport(1 - CONTROLS_MIN_FRACTION)

  const panel = document.createElement('div')
  panel.id = 'touch-controls'
  document.getElementById('app')!.appendChild(panel)
  const svg = el('svg')
  panel.appendChild(svg)

  const cross = el('path')
  const tris = {
    left: el('path'),
    right: el('path'),
    up: el('path'),
    down: el('path'),
  }
  const rings = { a: el('circle'), b: el('circle') }
  const glyphs = { a: el('text'), b: el('text') }

  for (const shape of [
    cross,
    ...Object.values(tris),
    ...Object.values(rings),
  ]) {
    shape.setAttribute('stroke-width', '2')
    shape.setAttribute('stroke-linejoin', 'round')
    svg.appendChild(shape)
  }
  for (const [name, node] of Object.entries(glyphs)) {
    node.textContent = name.toUpperCase()
    node.setAttribute('text-anchor', 'middle')
    node.setAttribute('dominant-baseline', 'central')
    node.setAttribute('font-family', 'monospace')
    node.setAttribute('font-weight', 'bold')
    svg.appendChild(node)
  }

  let geom = {
    cx: 0,
    cy: 0,
    e: 0,
    t: 0,
    buttons: {} as Record<'a' | 'b', [number, number, number]>,
  }

  const layout = () => {
    const { width: w, height: h } = panel.getBoundingClientRect()
    const m = Math.min(w, h)
    if (m <= 0) return
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))

    const cx = DPAD.cx * w
    const cy = DPAD.cy * h
    const e = (DPAD.size * m) / 2
    const t = (DPAD.thickness * m) / 2
    geom = { cx, cy, e, t, buttons: {} as typeof geom.buttons }

    cross.setAttribute(
      'd',
      polygon([
        [cx - e, cy - t],
        [cx - t, cy - t],
        [cx - t, cy - e],
        [cx + t, cy - e],
        [cx + t, cy - t],
        [cx + e, cy - t],
        [cx + e, cy + t],
        [cx + t, cy + t],
        [cx + t, cy + e],
        [cx - t, cy + e],
        [cx - t, cy + t],
        [cx - e, cy + t],
      ]),
    )

    const mid = (e + t) / 2
    const s = t * 0.55
    for (const [name, [dx, dy]] of Object.entries(DIRS) as [
      Dir,
      [number, number],
    ][]) {
      const mx = cx + dx * mid
      const my = cy + dy * mid
      tris[name].setAttribute(
        'd',
        polygon([
          [mx + dx * s, my + dy * s],
          [mx - dx * s - dy * s, my - dy * s - dx * s],
          [mx - dx * s + dy * s, my - dy * s + dx * s],
        ]),
      )
    }

    for (const [name, spec] of Object.entries(BUTTONS) as [
      'a' | 'b',
      typeof BUTTONS.a,
    ][]) {
      const bx = spec.cx * w
      const by = spec.cy * h
      const r = (spec.d * m) / 2
      geom.buttons[name] = [bx, by, r]
      rings[name].setAttribute('cx', String(bx))
      rings[name].setAttribute('cy', String(by))
      rings[name].setAttribute('r', String(r))
      glyphs[name].setAttribute('x', String(bx))
      glyphs[name].setAttribute('y', String(by))
      glyphs[name].setAttribute('font-size', String(r * 0.95))
    }
    paint(pressed)
  }

  const paint = (on: Set<InputName>) => {
    cross.setAttribute('stroke', LINE)
    cross.setAttribute('fill', 'none')
    for (const name of Object.keys(DIRS) as Dir[]) {
      const lit = on.has(name)
      tris[name].setAttribute('stroke', lit ? LINE_ACTIVE : LINE)
      tris[name].setAttribute('fill', lit ? LINE_ACTIVE : 'none')
    }
    for (const name of ['a', 'b'] as const) {
      const lit = on.has(name)
      rings[name].setAttribute('stroke', lit ? LINE_ACTIVE : LINE)
      rings[name].setAttribute('fill', lit ? FILL_ACTIVE : 'none')
      glyphs[name].setAttribute('fill', lit ? LINE_ACTIVE : LINE)
    }
  }

  const hitTest = (x: number, y: number): InputName | undefined => {
    for (const name of ['a', 'b'] as const) {
      const [bx, by, r] = geom.buttons[name] ?? [0, 0, 0]
      if (Math.hypot(x - bx, y - by) <= r * TOUCH_SLOP) return name
    }
    const { cx, cy, e, t } = geom
    const dx = x - cx
    const dy = y - cy
    const reach = e * TOUCH_SLOP
    if (Math.abs(dx) > reach || Math.abs(dy) > reach) return undefined
    if (Math.abs(dx) < t && Math.abs(dy) < t) return undefined
    return Math.abs(dx) > Math.abs(dy)
      ? dx < 0
        ? 'left'
        : 'right'
      : dy < 0
        ? 'up'
        : 'down'
  }

  const contacts = new Map<number, InputName>()
  let pressed = new Set<InputName>()

  const refresh = () => {
    const now = new Set(contacts.values())
    const codes = (s: Set<InputName>) =>
      new Set([...s].map((i) => KEY_FOR[i].code))
    const before = codes(pressed)
    const after = codes(now)
    for (const input of now) {
      const { code } = KEY_FOR[input]
      if (before.has(code)) continue
      before.add(code)
      send('keydown', input)
      navigator.vibrate?.(VIBRATE_MS)
    }
    for (const input of pressed) {
      if (!after.has(KEY_FOR[input].code)) send('keyup', input)
    }
    pressed = now
    paint(pressed)
  }

  const send = (type: 'keydown' | 'keyup', input: InputName) => {
    const { key, code, keyCode } = KEY_FOR[input]
    window.dispatchEvent(
      new KeyboardEvent(type, {
        key,
        code,
        keyCode,
        which: keyCode,
        bubbles: true,
      }),
    )
  }

  const onTouch = (e: TouchEvent) => {
    e.preventDefault()
    const rect = panel.getBoundingClientRect()
    contacts.clear()
    for (const t of Array.from(e.touches)) {
      const hit = hitTest(t.clientX - rect.left, t.clientY - rect.top)
      if (hit) contacts.set(t.identifier, hit)
    }
    refresh()
  }
  for (const type of [
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
  ] as const) {
    panel.addEventListener(type, onTouch, { passive: false })
  }
  for (const type of [
    'contextmenu',
    'gesturestart',
    'gesturechange',
  ] as const) {
    panel.addEventListener(type, (e) => e.preventDefault())
  }

  new ResizeObserver(layout).observe(panel)
  layout()
  return true
}
