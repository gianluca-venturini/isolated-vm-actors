const main = () => {
  const actors = getNearbyActors();

  if (actors.length > 0) {
    const actor = actors[0];
    changeSpeed(-actor.position.x, -actor.position.y);
  }
}
