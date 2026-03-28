/**
 * CSS-driven gradient mesh (keyframes + radial orbs).
 * Visual direction informed by v0 generated hero reference (mesh drift orbs).
 */
export function AmbientMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl"
    >
      <span className="mesh-orb-a absolute -left-1/4 -top-1/4 h-[min(70vmax,42rem)] w-[min(70vmax,42rem)] opacity-[0.38] dark:opacity-[0.22]" />
      <span className="mesh-orb-b absolute -bottom-1/4 -right-1/4 h-[min(65vmax,38rem)] w-[min(65vmax,38rem)] opacity-[0.32] dark:opacity-[0.18]" />
      <span className="mesh-orb-c absolute left-1/2 top-1/2 h-[min(50vmax,28rem)] w-[min(50vmax,28rem)] -translate-x-1/2 -translate-y-1/2 opacity-[0.26] dark:opacity-[0.14]" />
      <span className="absolute inset-0 backdrop-blur-[100px]" />
    </div>
  );
}
