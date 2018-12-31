export {}

declare global {
  interface Vector2D {
    x: number,
    y: number,
  }

  function log(...args: any): void;
  function changeSpeed(x: number, y: number): void;
  /**
   * Return the actors that are currently visible in order of distance from the actor.
   * The position of the nearby actors are relative to the point of vuew of the current actor.
   */
  function getNearbyActors(): ReadonlyArray<{
    position: Vector2D,
    type: string,
  }>;
}