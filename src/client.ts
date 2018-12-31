const serverUrl = "ws://" + window.location.hostname + ":6502";

const connection = new WebSocket(serverUrl);

connection.onopen = function() {
  console.log('Opened connection with server');
};

connection.onerror = function() {
  console.log('Error');
};

interface ActorPosition {
  id: string;
  type: string;
  position: {x: number, y: number};
  crashes: number;
}

connection.onmessage = function(evt: any) {
  console.log('Received message');
  const actor = JSON.parse(evt.data) as ActorPosition;
  let actorDOM = document.getElementById(actor.id);
  console.log(actorDOM);

  if (!actorDOM) {
    console.log('Create new actor');
    actorDOM = document.createElement('div');
    actorDOM.className = `actor ${actor.id} ${actor.type}`;
    actorDOM.id = actor.id;
    document.body.append(actorDOM);
  }

  actorDOM.setAttribute('style', `top: ${actor.position.y}px; left: ${actor.position.x}px`);

}
