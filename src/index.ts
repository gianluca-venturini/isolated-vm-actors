
'use strict';
import * as ivm from 'isolated-vm';
import * as fs from 'fs';
import * as path from 'path';
import {server as WebSocketServer, connection} from 'websocket';
import * as http from 'http';

var server = http.createServer(function(request, response) {
  response.writeHead(404);
  response.end();
});

server.listen(6502, function() {
  console.log((new Date()) + " Server is listening on port 6502");
});

var wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: true // You should use false here!
});

const connections: connection[] = [];
wsServer.on('connect', function(connection: connection) {
  console.log('Client connected');
  connections.push(connection);

  connection.on('close', function() {
    console.log('Client disconnected');
    const index = connections.indexOf(connection);
    if (index >= 0) {
      delete connections[index]
    }
  });

  connection.on('message', function() {});
});

// You *must* require the extension in nodejs first.
require('.');

interface Vector2D {
  x: number;
  y: number;
}

interface Actor {
  id: number,
  isolate: ivm.Isolate,
  runMainScript: ivm.Script;
  context: ivm.Context;
  numCrashes: number;
  position: Vector2D;
  speed: Vector2D;
  type: string;
}

const FIELD = {
  width: 1400,
  height: 1000,
}
const ACTOR_MAX_SPEED = 10;
const ACTOR_RANGE = 500;
const MAX_ACTOR_MEMORY = 16;

const actors: Actor[] = [];

function distance(p1: Vector2D, p2: Vector2D) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function sub(p1: Vector2D, p2: Vector2D) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
  }
}

function clamp(v: Vector2D, absMax: number) {
  const sx = v.x >= 0 ? 1 : -1;
  const sy = v.y >= 0 ? 1 : -1;

  return {
    x: Math.min(v.x / v.x, absMax) * sx,
    y: Math.min(v.y / v.y, absMax) * sy,
  }
}

let nextActorId = 0;

function addActor(actorType: string) {
  let isolate = new ivm.Isolate({memoryLimit: MAX_ACTOR_MEMORY});
  let context = isolate.createContextSync();
  let globalReference = context.globalReference();
  const position = {
    x: Math.random() * FIELD.width,
    y: Math.random() * FIELD.height,
  };
  const speed = {x: 0, y: 0};

  // Create unsafe functions
  globalReference.setSync('_log', new ivm.Reference(function(...args: any) {
    console.log(`Actor [${actorType}]: `, ...args);
  }));
  globalReference.setSync('_changeSpeed', new ivm.Reference(function(x: number, y: number) {
    const newSpeed = clamp({x, y}, ACTOR_MAX_SPEED);
    speed.x = newSpeed.x;
    speed.y = newSpeed.y;
  }));
  globalReference.setSync('_getNearbyActors', new ivm.Reference(function() {
    const nearbyActors = actors
      .filter(actor => actor.isolate !== isolate)
      .filter(actor => distance(actor.position, position) <= ACTOR_RANGE)
      .map(actor => ({
        // Position is relative to the current actor
        position: sub(actor.position, position),
        type: actor.type,
      }));

    nearbyActors.sort(
      (actor1, actor2) => (
         distance(position, actor1.position) - distance(position, actor2.position)
      ),
    );
    return new ivm.ExternalCopy(nearbyActors).copyInto();
  }));

  globalReference.setSync('_ivm', ivm);
  globalReference.setSync('global', globalReference.derefInto());

  const bootstrap = isolate.compileScriptSync(`
    new function() {
      const ivm = _ivm;
      const log = _log;
      const changeSpeed = _changeSpeed;
      const getNearbyActors = _getNearbyActors;

      delete _ivm;
      delete _changeSpeed;
      delete _getNearbyActors;

      global.log = function(...args) {
        log.applySync(undefined, args.map(arg => new ivm.ExternalCopy(arg).copyInto()));
      }
      global.changeSpeed = function(x, y) {
        changeSpeed.applySync(undefined, [x, y]);
      }
      global.getNearbyActors = function() {
        return getNearbyActors.applySync(undefined, []);
      }
    }
  `);
  bootstrap.runSync(context);

  const mainScript = isolate.compileScriptSync(
    fs.readFileSync(path.join(__dirname, '..', 'actors', actorType + '.js')).toString('utf-8')
  );

  mainScript.runSync(context);

  const runMainScript = isolate.compileScriptSync('main();');

  actors.push({
    id: nextActorId,
    isolate,
    runMainScript,
    context,
    numCrashes: 0,
    position,
    speed,
    type: actorType,
  });

  nextActorId += 1;
}

/**
 * Execute one tick for every actor
 */
function executeAllActors() {
  actors.forEach(actor => {
    try {
      actor.runMainScript.runSync(actor.context);

      actor.position.x = Math.min(Math.max(actor.position.x + actor.speed.x, 0), FIELD.width);
      actor.position.y = Math.min(Math.max(actor.position.y + actor.speed.y, 0), FIELD.height);
    } catch (e) {
      console.error(e);
      actor.numCrashes += 1;
    }
    // console.log({id: actor.id, type: actor.type, position: actor.position, crashes: actor.numCrashes});
    const message = JSON.stringify({
      id: actor.id,
      type: actor.type,
      position: actor.position,
      crashes: actor.numCrashes
    });
    connections.forEach(connection => {
      connection.sendUTF(message);
    })
  })
}

addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');
addActor('actor1');

addActor('actor2');
addActor('actor2');
addActor('actor2');
addActor('actor2');
addActor('actor2');
addActor('actor2');
addActor('actor2');
addActor('actor2');
addActor('actor2');

// Main game loop
setInterval(() => {
  executeAllActors();
}, 100);
