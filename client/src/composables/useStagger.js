// Returns a class for stagger entry animation.
// Usage:  <li :class="stagger(index)">  where index 0..7
export function stagger(index) {
  const i = Math.min(7, Math.max(0, index));
  return `rise rise-delay-${i}`;
}
