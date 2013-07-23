var chem = require('chem');
var MilitiaShip = require('./militia_ship');
var ShipAi = require('./ship_ai');
var Explosion = require('./explosion');
var Bullet = require('./bullet');
var v = chem.vec2d;

var PLAYER_TEAM = 0;
var SCROLL_SPEED = 12;
var shipTypes = {
  Militia: MilitiaShip,
};

var canvas = document.getElementById("game");
var engine = new chem.Engine(canvas);
engine.setSize(v(1067, 600));
engine.showLoadProgressBar();
engine.start();
canvas.focus();
chem.resources.on('ready', function () {
  var state = new State(engine);
  state.loadCurrentLevel();
  var paused = false;
  var fpsLabel = engine.createFpsLabel();
  state.batchStatic.add(fpsLabel);
  var pausedLabel = new chem.Label("PAUSED", {
    pos: engine.size.scaled(0.5),
    zOrder: 1,
    fillStyle: "#ffffff",
    font: "24px monospace",
    batch: state.batch,
    textAlign: 'center',
    textBaseline: 'middle',
    visible: false,
  });
  state.batchStatic.add(pausedLabel);

  engine.on('update', onUpdate);

  var mouseDownStart = null;
  function startBoundingBox() {
    mouseDownStart = state.mousePos();
  }

  function finishBoundingBox() {
    var mouseDownEnd = state.mousePos();

    // orient so start is before end
    var tmp;
    if (mouseDownStart.x > mouseDownEnd.x) {
      tmp = mouseDownStart.x;
      mouseDownStart.x = mouseDownEnd.x;
      mouseDownEnd.x = tmp;
    }
    if (mouseDownStart.y > mouseDownEnd.y) {
      tmp = mouseDownStart.y;
      mouseDownStart.y = mouseDownEnd.y;
      mouseDownEnd.y = tmp;
    }

    clearSelection();

    // iterate over owned AIs
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      if (ai.ship.team !== PLAYER_TEAM) continue;
      if (ai.ship.pos.x >= mouseDownStart.x && ai.ship.pos.x < mouseDownEnd.x &&
          ai.ship.pos.y >= mouseDownStart.y && ai.ship.pos.y < mouseDownEnd.y)
      {
        ai.select();
      }
    }

    mouseDownStart = null;
  }

  function clearSelection() {
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      ai.deselect();
    }
  }

  function manualOverrideClick() {
    var aiShip = clickedAiShip(state.mousePos());
    if (aiShip) {
      state.beginManualOverride(aiShip);
    } else {
      state.endManualOverride();
    }
  }

  function togglePause() {
    paused = !paused;
    pausedLabel.setVisible(paused);
    if (paused) {
      engine.removeListener('update', onUpdate);
    } else {
      engine.on('update', onUpdate);
    }
  }

  function placeShipAtCursor() {
    var team = engine.buttonState(chem.button.Key2) ? 1 : 0;
    var ship = new MilitiaShip(state, {team: team, pos: state.mousePos()});
    state.addShip(ship);
  }

  function sendUnitsToCursor() {
    state.sendSelectedUnitsTo(state.mousePos());
  }

  engine.on('buttondown', function(button) {
    switch (button) {
      case chem.button.MouseLeft:
        if (engine.buttonState(chem.button.Key0)) {
          manualOverrideClick();
        } else {
          startBoundingBox();
        }
        break;
      case chem.button.MouseRight:
        if (engine.buttonState(chem.button.Key1) || engine.buttonState(chem.button.Key2)) {
          placeShipAtCursor();
        } else {
          sendUnitsToCursor();
        }
        break;
      case chem.button.KeyP:
        togglePause();
        break;
    }
  });
  engine.on('buttonup', function(button) {
    switch (button) {
      case chem.button.MouseLeft:
        finishBoundingBox();
        break;
    }
  });
  engine.on('draw', function (context) {
    // clear canvas to black
    context.fillStyle = '#000000';
    context.fillRect(0, 0, engine.size.x, engine.size.y);

    // batch far bg
    var bgBackScroll = state.scroll.scaled(state.bgBackFactor).neg().floor();
    context.translate(bgBackScroll.x, bgBackScroll.y);
    state.batchBgBack.draw(context);

    // batch close bg
    var bgForeScroll = state.scroll.scaled(state.bgForeFactor).neg().floor();
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    context.translate(bgForeScroll.x, bgForeScroll.y);
    state.batchBgFore.draw(context);

    // draw all sprites in batch
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    context.translate(-state.scroll.x, -state.scroll.y);
    state.batch.draw(context);
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      ai.draw(context);
    }

    // draw a selection box
    if (mouseDownStart) {
      var size = state.mousePos().minus(mouseDownStart);
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.strokeRect(mouseDownStart.x, mouseDownStart.y, size.x, size.y);
    }

    // static stuff
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    state.batchStatic.draw(context);
  });

  function onUpdate (dt, dx) {
    var id;
    for (id in state.physicsObjects) {
      var obj = state.physicsObjects[id];
      obj.update(dt, dx);
    }

    if (engine.buttonState(chem.button.KeyUp)) state.scroll.y -= SCROLL_SPEED * dx;
    if (engine.buttonState(chem.button.KeyDown)) state.scroll.y += SCROLL_SPEED * dx;
    if (engine.buttonState(chem.button.KeyRight)) state.scroll.x += SCROLL_SPEED * dx;
    if (engine.buttonState(chem.button.KeyLeft)) state.scroll.x -= SCROLL_SPEED * dx;
    state.capScrollPosition();

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
  this.levelIndex = 0;
  this.physicsObjects = {};
  this.aiObjects = {};
  this.manualOverride = null;
  this.engine = engine;
  this.batchBgBack = new chem.Batch();
  this.batchBgFore = new chem.Batch();
  this.batch = new chem.Batch();
  this.batchStatic = new chem.Batch();
  this.bgBackObjects = {};
  this.bgBackFactor = 0.10; // scrolls 10x slower than normal
  this.bgForeFactor = 0.15;
  this.mapSize = null; // set when loading map
}

State.prototype.mousePos = function() {
  return engine.mousePos.plus(this.scroll);
};

State.prototype.capScrollPosition = function() {
  if (this.scroll.x < 0) this.scroll.x = 0;
  if (this.scroll.y < 0) this.scroll.y = 0;
  if (this.scroll.x + engine.size.x > this.mapSize.x) this.scroll.x = this.mapSize.x - engine.size.x;
  if (this.scroll.y + engine.size.y > this.mapSize.y) this.scroll.y = this.mapSize.y - engine.size.y;
};

State.prototype.generateStars = function() {
  var unseenMapSize = this.mapSize.minus(engine.size);
  this.bgBackSize = unseenMapSize.scaled(this.bgBackFactor).add(engine.size);
  this.bgForeSize = unseenMapSize.scaled(this.bgForeFactor).add(engine.size);
  generateStars(this, this.bgBackSize, 0.00025, this.batchBgBack);
  generateStars(this, this.bgForeSize, 0.00005, this.batchBgFore);
  // put in a planet
  var sprite = new chem.Sprite("planet-red", {
    batch: this.batchBgFore,
    zOrder: 1,
    pos: v(Math.random() * this.bgForeSize.x, Math.random() * this.bgForeSize.y),
  });
};

function generateStars(self, size, density, batch) {
  var area = size.x * size.y;
  var count = density * area;
  for (var i = 0; i < count; i += 1) {
    var name = Math.random() > 0.50 ? "star/small" : "star/large";
    var sprite = new chem.Sprite(name, {
      batch: batch,
      pos: v(Math.random() * size.x, Math.random() * size.y),
    });
  }
}

State.prototype.loadCurrentLevel = function() {
  var levelText = chem.resources.text["level" + this.levelIndex + ".json"];
  var level;
  try {
    level = JSON.parse(levelText);
  } catch (err) {
    throw new Error("Error parsing level. Invalid JSON: " + err.stack);
  }

  this.mapSize = v(level.size);
  this.scroll = level.scroll ? v(level.scroll) : v();

  this.generateStars();

  for (var i = 0; i < level.objects.length; i += 1) {
    var obj = level.objects[i];
    var props = obj.properties;
    switch (obj.type) {
      case "ShipCluster":
        this.addShipCluster(props);
        break;
      default:
        throw new Error("unrecognized object type in level: " + obj.type);
    }
  }
};

State.prototype.addShipCluster = function(o) {
  var pos = v(o.pos);
  var size = v(o.size);
  var ShipType = shipTypes[o.type];
  assert(ShipType, "Invalid ship type: " + o.type);
  for (var i = 0; i < o.count; i += 1) {
    var thisPos = pos.offset(Math.random() * size.x, Math.random() * size.y);
    var ship = new ShipType(this, {
      team: o.team,
      pos: thisPos,
      rotation: Math.random() * 2 * Math.PI,
    });
    this.addShip(ship);
  }
};

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

State.prototype.addShip = function(ship) {
  this.addPhysicsObject(ship);
  var shipAi = new ShipAi(this, ship);
  this.addAiObject(shipAi);
};


State.prototype.createExplosion = function(pos, vel) {
  var explosion = new Explosion(this, pos, vel);
  this.addPhysicsObject(explosion);
};

State.prototype.addBullet = function(bullet) {
  this.addPhysicsObject(bullet);
};

State.prototype.isOffscreen = function(pos) {
  return (pos.x < 0 || pos.x > this.mapSize.x || pos.y < 0 || pos.y > this.mapSize.y);
};

State.prototype.sendSelectedUnitsTo = function(pt) {
  var squad = new ScatterSquad(pt);
  for (var id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (! ai.selected) continue;
    squad.add(ai);
  }
  squad.command();
};

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}

function ScatterSquad(dest) {
  this.dest = dest;
  this.avgPos = v();
  this.units = [];
}

ScatterSquad.prototype.add = function(ai) {
  this.units.push(ai);
  this.avgPos.add(ai.ship.pos);
};

ScatterSquad.prototype.command = function() {
  this.avgPos.scale(1 / this.units.length);
  this.direction = this.dest.minus(this.avgPos).normalize();
  for (var i = 0; i < this.units.length; i += 1) {
    var unit = this.units[i];
    unit.commandToPoint(this.direction);
  }
};
