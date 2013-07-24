var chem = require('chem');
var ShipAi = require('./ship_ai');
var Fx = require('./fx');
var Bullet = require('./bullet');
var sfx = require('./sfx');
var Team = require('./team');
var v = chem.vec2d;

var PLAYER_TEAM = new Team();
var ENEMY_TEAM = new Team();
var SCROLL_SPEED = 12;
var shipTypes = {
  Militia: require('./militia_ship'),
  Ranger: require('./ranger_ship'),
  Flag: require('./flag_ship'),
  Turret: require('./turret_ship'),
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
    var start = mouseDownStart;
    var end = state.mousePos();
    mouseDownStart = null;

    // orient so start is before end
    var tmp;
    if (start.x > end.x) {
      tmp = start.x;
      start.x = end.x;
      end.x = tmp;
    }
    if (start.y > end.y) {
      tmp = start.y;
      start.y = end.y;
      end.y = tmp;
    }

    if (! engine.buttonState(chem.button.KeyCtrl) &&
        ! engine.buttonState(chem.button.KeyShift))
    {
      clearSelection();
    }

    if (end.minus(start).length() < 4) {
      var clickedAi = clickedAiShip(end);
      if (clickedAi && clickedAi.ship.team === PLAYER_TEAM) clickedAi.select();
      return;
    }

    // iterate over owned AIs
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      if (ai.ship.team !== PLAYER_TEAM) continue;
      if (ai.ship.pos.x >= start.x && ai.ship.pos.x < end.x &&
          ai.ship.pos.y >= start.y && ai.ship.pos.y < end.y)
      {
        ai.select();
      }
    }
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
    var team = engine.buttonState(chem.button.Key2) ? ENEMY_TEAM : PLAYER_TEAM;
    var ship = new shipTypes.Militia(state, {team: team, pos: state.mousePos()});
    state.addShip(ship);
  }

  function sendUnitsToCursor() {
    var shiftHeld = engine.buttonState(chem.button.KeyShift);
    var altHeld = engine.buttonState(chem.button.KeyCtrl);
    state.sendSelectedUnitsTo(state.mousePos(), shiftHeld, altHeld);
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
          var obj = clickedAttackableObject(state.mousePos());
          if (obj && obj.team !== PLAYER_TEAM) {
            state.selectedUnitsAttack(obj);
          } else {
            sendUnitsToCursor();
          }
        }
        break;
      case chem.button.KeyP:
        togglePause();
        break;
      case chem.button.KeyDelete:
        state.deleteSelectedShips();
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

  function clickedAttackableObject(pos) {
    for (var id in state.physicsObjects) {
      var obj = state.physicsObjects[id];
      if (!obj.canBeShot) continue;
      if (obj.pos.distance(pos) < obj.radius) {
        return obj;
      }
    }
    return null;
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
  this.scroll.boundMin(v());
  this.scroll.boundMax(this.mapSize.minus(engine.size));
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
        props.team = Team.get(props.team || 0);
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

State.prototype.createElectricFx = function(pos, vel, rotation) {
  var fx = new Fx(this, {
    pos: pos,
    vel: vel,
    animationName: 'fx/electric',
    duration: 0.3,
    rotation: rotation + Math.PI / 2,
  });
  this.addPhysicsObject(fx);
  sfx.electricAttack();
};

State.prototype.createExplosion = function(pos, vel) {
  var explosion = new Fx(this, {
    pos: pos,
    vel: vel,
    animationName: 'explosion',
    duration: 0.6,
  });
  this.addPhysicsObject(explosion);
  sfx.explosion();
};

State.prototype.addBullet = function(bullet) {
  this.addPhysicsObject(bullet);
};

State.prototype.isOffscreen = function(pos) {
  return (pos.x < 0 || pos.x > this.mapSize.x || pos.y < 0 || pos.y > this.mapSize.y);
};

State.prototype.deleteSelectedShips = function() {
  for (var id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (! ai.selected) continue;
    ai.ship.hit(1);
  }
};

State.prototype.selectedUnitsAttack = function(target) {
  for (var id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (! ai.selected) continue;
    ai.commandToAttack(target);
  }
};

State.prototype.sendSelectedUnitsTo = function(pt, queue, loose) {
  var squad = new ScatterSquad(pt);
  if (loose) squad.loose = true;
  for (var id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (! ai.selected) continue;
    squad.add(ai);
  }
  squad.command(queue);
};

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}

function ScatterSquad(dest) {
  this.dest = dest;
  this.avgPos = v();
  this.units = [];
  this.loose = false;
}

ScatterSquad.prototype.add = function(ai) {
  this.units.push(ai);
  this.avgPos.add(ai.ship.pos);
};

ScatterSquad.prototype.command = function(queue) {
  var dest = this.dest;
  this.avgPos.scale(1 / this.units.length);
  this.direction = this.dest.minus(this.avgPos).normalize();
  // figure out max radius
  var maxRadius = 0;
  this.units.forEach(function(unit) {
    if (unit.ship.radius > maxRadius) maxRadius = unit.ship.radius;
  });
  var unitCountY = Math.floor(Math.sqrt(this.units.length));
  var unitCountX = unitCountY * unitCountY === this.units.length ? unitCountY : unitCountY + 1;
  // sort units by rankOrder and then distance from target point
  this.units.sort(function(a, b) {
    var rankOrderDelta = a.ship.rankOrder - b.ship.rankOrder;
    if (rankOrderDelta !== 0) return rankOrderDelta;
    return a.ship.pos.distanceSqrd(dest) - b.ship.pos.distanceSqrd(dest);
  });
  // create the unaligned positions
  var positions = new Array(this.units.length);
  var destRelCenter = v();
  var i, x, pt;
  for (i = 0, x = 0; i < this.units.length; x += 1) {
    for (var y = 0; y < unitCountY; y += 1, i += 1) {
      pt = v(x * maxRadius * 2, y * maxRadius * 2);
      positions[i] = pt;
      destRelCenter.add(pt);
    }
  }
  destRelCenter.scale(1 / this.units.length);

  for (i = 0; i < positions.length; i += 1) {
    // shift so that 0, 0 is in the center
    positions[i] = destRelCenter.minus(positions[i]);
    // rotate about 0, 0 to align with direction
    positions[i].rotate(this.direction);
    // translate to dest
    positions[i].add(dest);
  }

  for (i = 0; i < this.units.length; i += 1) {
    var unit = this.units[i];
    unit.commandToMove(positions[i], queue, this.loose);
    if (! this.loose) unit.commandToPoint(this.direction, true);
  }
};
