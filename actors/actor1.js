const main = () => {
  let actors = getNearbyActors();

  actors = actors.filter(actor => (
    Math.sqrt(Math.pow(actor.position.x, 2) + Math.pow(actor.position.x, 2)) > 20
  ));

  if (actors.length > 0) {
    const actor = actors[0];
    changeSpeed(actor.position.x, actor.position.y);
  }
}
