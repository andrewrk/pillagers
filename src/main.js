var chem = require('chem');
var MilitiaShip = require('./militia_ship');
var ShipAi = require('./ship_ai');
var Explosion = require('./explosion');
var Bullet = require('./bullet');
var v = chem.vec2d;
var canvas = document.getElementById("game");
var engine = new chem.Engine(canvas);
engine.setSize(v(1067, 600));
engine.showLoadProgressBar();
engine.start();
canvas.focus();
chem.resources.on('ready', function () {
  var state = new State(engine);
  var paused = false;
  var fpsLabel = engine.createFpsLabel();
  var pausedLabel = new chem.Label("PAUSED", {
    pos: engine.size.scaled(0.5),
    zOrder: 1,
    fillStyle: "#ffffff",
    font: "20pt monospace",
    batch: state.batch,
    textAlign: 'center',
    textBaseline: 'middle',
    visible: false,
  });

  // add ship on the left
  state.createShip(0, v(200, 200));
  state.createShip(1, v(500, 200));


  engine.on('update', onUpdate);

  engine.on('buttondown', function(button) {
    if (button === chem.button.MouseLeft) {
      // manual override ship
      var aiShip = clickedAiShip(engine.mousePos);
      if (aiShip) {
        state.beginManualOverride(aiShip);
      } else {
        state.endManualOverride();
      }
    } else if (button === chem.button.MouseRight) {
      // place ship
      var team = engine.buttonState(chem.button.Key2) ? 1 : 0;
      state.createShip(team, engine.mousePos.clone());
    } else if (button === chem.button.KeyP) {
      paused = !paused;
      pausedLabel.setVisible(paused);
      if (paused) {
        engine.removeListener('update', onUpdate);
      } else {
        engine.on('update', onUpdate);
      }
    }
  });
  engine.on('draw', function (context) {
    // clear canvas to black
    context.fillStyle = '#000000'
    context.fillRect(0, 0, engine.size.x, engine.size.y);

    // draw all sprites in batch
    state.batch.draw(context);
    for (var id in state.physicsObjects) {
      var obj = state.physicsObjects[id];
      obj.draw(context);
    }

    fpsLabel.draw(context);
  });

  function onUpdate (dt, dx) {
    var id;
    for (id in state.physicsObjects) {
      var obj = state.physicsObjects[id];
      obj.update(dt, dx);
    }

    for (id in state.aiObjects) {
      var ai = state.aiObjects[id];
      if (state.manualOverride === ai.id) {
        var ship = ai.ship;
        // rotate the ship with left and right arrow keys
        ship.rotateInput = 0;
        if (engine.buttonState(chem.button.KeyLeft)) ship.rotateInput -= 1;
        if (engine.buttonState(chem.button.KeyRight)) ship.rotateInput += 1;

        // apply forward and backward thrust with up and down arrow keys
        var thrust = 0;
        if (engine.buttonState(chem.button.KeyUp)) thrust += 1;
        if (ship.hasBackwardsThrusters && engine.buttonState(chem.button.KeyDown)) thrust -= 1;
        ship.setThrustInput(thrust);

        ship.shootInput = engine.buttonState(chem.button.KeySpace) ? 1 : 0;
      } else {
        ai.update(dt, dx);
      }
    }
  }

  function clickedAiShip(pos) {
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      if (ai.ship.pos.distance(pos) < ai.ship.radius) {
        return ai;
      }
    }
    return null;
  }
});

function State(engine) {
  this.physicsObjects = {};
  this.aiObjects = {};
  this.manualOverride = null;
  this.engine = engine;
  this.batch = new chem.Batch();
}

State.prototype.beginManualOverride = function(ai) {
  assert(ai.id);
  this.manualOverride = ai.id;
}

State.prototype.endManualOverride = function() {
  this.manualOverride = null;
}

State.prototype.addPhysicsObject = function(o) {
  assert(o.id);
  this.physicsObjects[o.id] = o;
};

State.prototype.deletePhysicsObject = function(o) {
  assert(o.id);
  delete this.physicsObjects[o.id];
}

State.prototype.deleteAi = function(ai) {
  delete this.aiObjects[ai.id];
};

State.prototype.addAiObject = function(o) {
  assert(o.id);
  this.aiObjects[o.id] = o;
};

State.prototype.createShip = function(team, pos) {
  var ship = new MilitiaShip(this, {team: team, pos: pos});
  this.batch.add(ship.sprite);
  this.addPhysicsObject(ship);
  var shipAi = new ShipAi(this, ship);
  this.addAiObject(shipAi);
};

State.prototype.createExplosion = function(pos, vel) {
  var explosion = new Explosion(this, pos, vel);
  this.addPhysicsObject(explosion);
  this.batch.add(explosion.sprite);
};

State.prototype.addBullet = function(bullet) {
  this.batch.add(bullet.sprite);
  this.addPhysicsObject(bullet);
};

State.prototype.isOffscreen = function(pos) {
  return (pos.x < 0 || pos.x > this.engine.size.x || pos.y < 0 || pos.y > this.engine.size.y);
};

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}
