var chem = require('chem');
var v = chem.vec2d;

var ShipAi = require('./ship_ai');
var Fx = require('./fx');
var sfx = require('./sfx');
var Team = require('./team');
var Meteor = require('./meteor');
var Portal = require('./portal');

var PLAYER_TEAM = new Team();
var ENEMY_TEAM = new Team();
var SCROLL_SPEED = 12;
var shipTypes = {
  Militia: require('./militia_ship'),
  Ranger: require('./ranger_ship'),
  Flag: require('./flag_ship'),
  Turret: require('./turret_ship'),
};

module.exports = State;

function State(game) {
  this.game = game;
  this.physicsObjects = {};
  this.aiObjects = {};
  this.selection = {};
  this.selectedCount = 0;
  this.manualOverride = null;
  this.engine = game.engine;
  this.batchBgBack = new chem.Batch();
  this.batchBgFore = new chem.Batch();
  this.batch = new chem.Batch();
  this.batchStatic = new chem.Batch();
  this.batchUiPane = new chem.Batch();
  this.bgBackObjects = {};
  this.bgBackFactor = 0.10; // scrolls 10x slower than normal
  this.bgForeFactor = 0.15;
  this.mapSize = null; // set when loading map

  this.paused = false;
  var fpsLabel = this.engine.createFpsLabel();
  this.batchStatic.add(fpsLabel);
  this.pausedLabel = new chem.Label("PAUSED", {
    pos: this.engine.size.scaled(0.5),
    zOrder: 1,
    fillStyle: "#ffffff",
    font: "24px monospace",
    batch: this.batch,
    textAlign: 'center',
    textBaseline: 'middle',
    visible: false,
  });
  this.batchStatic.add(this.pausedLabel);

  this.mouseDownStart = null;

  this.onUpdateBound = onUpdate.bind(this);

  this.uiPaneImg = chem.resources.images['ui-pane.png'];
  this.uiPaneTop = this.engine.size.y - this.uiPaneImg.height;
}

State.prototype.delete = function() {
  this.clearSelection();
  for (var id in this.physicsObjects) {
    var obj = this.physicsObjects[id];
    obj.delete();
  }
  this.engine.removeAllListeners();
};

State.prototype.start = function() {
  this.engine.on('update', this.onUpdateBound);
  this.engine.on('buttondown', onButtonDown.bind(this));
  this.engine.on('buttonup', onButtonUp.bind(this));
  this.engine.on('draw', onDraw.bind(this));
}

function startBoundingBox(state) {
  state.mouseDownStart = state.mousePos();
}

function finishBoundingBox(state) {
  var start = state.mouseDownStart;
  var end = state.mousePos();
  state.mouseDownStart = null;

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

  if (! state.engine.buttonState(chem.button.KeyCtrl) &&
      ! state.engine.buttonState(chem.button.KeyShift))
  {
    state.clearSelection();
  }

  if (end.minus(start).length() < 4) {
    var clickedObj = clickedSelectableObject(state, end);
    if (clickedObj) state.select(clickedObj);
    return;
  }

  // iterate over owned objects
  for (var id in state.aiObjects) {
    var ai = state.aiObjects[id];
    if (ai.ship.team !== PLAYER_TEAM) continue;
    if (ai.ship.pos.x >= start.x && ai.ship.pos.x < end.x &&
        ai.ship.pos.y >= start.y && ai.ship.pos.y < end.y)
    {
      state.select(ai.ship);
    }
  }

  state.updateUiPaneVisibility();
}

State.prototype.clearSelection = function() {
  for (var id in this.selection) {
    this.unselect(this.selection[id]);
  }
  assert(this.selectedCount === 0);
  this.updateUiPaneVisibility();
};

State.prototype.select = function (obj) {
  if (obj.id in this.selection) return;
  obj.selected = true;
  this.selection[obj.id] = obj;
  this.selectedCount += 1;
  this.updateUiPaneVisibility();
}

State.prototype.unselect = function (obj) {
  if (obj.id in this.selection) {
    obj.selected = false;
    delete this.selection[obj.id];
    this.selectedCount -= 1;
    this.updateUiPaneVisibility();
  }
}

State.prototype.updateUiPaneVisibility = function () {
  this.showUiPane = this.selectedCount > 0 || this.engine.mousePos.y >= this.uiPaneTop;
};

function clearSelection(state) {
  for (var id in state.aiObjects) {
    var ai = state.aiObjects[id];
    ai.deselect();
  }
}

function manualOverrideClick(state) {
  var aiShip = clickedAiShip(state, state.mousePos());
  if (aiShip) {
    state.beginManualOverride(aiShip);
  } else {
    state.endManualOverride();
  }
}

function togglePause(state) {
  this.paused = !this.paused;
  this.pausedLabel.setVisible(this.paused);
  if (this.paused) {
    this.engine.removeListener('update', this.onUpdateBound);
  } else {
    this.engine.on('update', this.onUpdateBound);
  }
}

function placeShipAtCursor(state) {
  var team = state.engine.buttonState(chem.button.Key2) ? ENEMY_TEAM : PLAYER_TEAM;
  var ship = new shipTypes.Militia(state, {team: team, pos: state.mousePos()});
  state.addShip(ship);
}

function sendUnitsToCursor(state) {
  var shiftHeld = state.engine.buttonState(chem.button.KeyShift);
  var altHeld = state.engine.buttonState(chem.button.KeyCtrl);
  state.sendSelectedUnitsTo(state.mousePos(), shiftHeld, altHeld);
}

function onButtonDown(button) {
  switch (button) {
    case chem.button.MouseLeft:
      if (this.engine.buttonState(chem.button.Key0)) {
        manualOverrideClick(this);
      } else {
        startBoundingBox(this);
      }
      break;
    case chem.button.MouseRight:
      if (this.engine.buttonState(chem.button.Key1) || this.engine.buttonState(chem.button.Key2)) {
        placeShipAtCursor(this);
      } else {
        var obj = clickedAttackableObject(this, this.mousePos());
        if (obj && obj.team !== PLAYER_TEAM) {
          this.selectedUnitsAttack(obj);
        } else {
          sendUnitsToCursor(this);
        }
      }
      break;
    case chem.button.KeyP:
      togglePause(this);
      break;
    case chem.button.KeyM:
      this.game.toggleMusic();
      break;
    case chem.button.KeyDelete:
      this.deleteSelectedShips();
      break;
  }
}

function onButtonUp(button) {
  switch (button) {
    case chem.button.MouseLeft:
      finishBoundingBox(this);
      break;
  }
}

function onDraw(context) {
  // clear canvas to black
  context.fillStyle = '#000000';
  context.fillRect(0, 0, this.engine.size.x, this.engine.size.y);

  // batch far bg
  var bgBackScroll = this.scroll.scaled(this.bgBackFactor).neg().floor();
  context.translate(bgBackScroll.x, bgBackScroll.y);
  this.batchBgBack.draw(context);

  // batch close bg
  var bgForeScroll = this.scroll.scaled(this.bgForeFactor).neg().floor();
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.translate(bgForeScroll.x, bgForeScroll.y);
  this.batchBgFore.draw(context);

  // draw all sprites in batch
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.translate(-this.scroll.x, -this.scroll.y);
  this.batch.draw(context);
  var id;
  for (id in this.physicsObjects) {
    var obj = this.physicsObjects[id];
    obj.draw(context);
  }
  for (id in this.aiObjects) {
    var ai = this.aiObjects[id];
    ai.draw(context);
  }

  // draw a selection box
  if (this.mouseDownStart) {
    var size = this.mousePos().minus(this.mouseDownStart);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.strokeRect(this.mouseDownStart.x, this.mouseDownStart.y, size.x, size.y);
  }

  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.translate(0, this.uiPaneTop);
  if (this.showUiPane) {
    context.drawImage(this.uiPaneImg, 0, 0);
    this.batchUiPane.draw(context);
  }

  // static stuff
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  this.batchStatic.draw(context);
}

function onUpdate(dt, dx) {
  var id;
  for (id in this.physicsObjects) {
    var obj = this.physicsObjects[id];
    obj.update(dt, dx);
  }

  if (!this.manualOverride) {
    if (this.engine.buttonState(chem.button.KeyUp)) this.scroll.y -= SCROLL_SPEED * dx;
    if (this.engine.buttonState(chem.button.KeyDown)) this.scroll.y += SCROLL_SPEED * dx;
    if (this.engine.buttonState(chem.button.KeyRight)) this.scroll.x += SCROLL_SPEED * dx;
    if (this.engine.buttonState(chem.button.KeyLeft)) this.scroll.x -= SCROLL_SPEED * dx;
  }
  this.capScrollPosition();

  for (id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (this.manualOverride === ai.id) {
      var ship = ai.ship;
      // rotate the ship with left and right arrow keys
      ship.rotateInput = 0;
      if (this.engine.buttonState(chem.button.KeyLeft)) ship.rotateInput -= 1;
      if (this.engine.buttonState(chem.button.KeyRight)) ship.rotateInput += 1;

      // apply forward and backward thrust with up and down arrow keys
      var thrust = 0;
      if (this.engine.buttonState(chem.button.KeyUp)) thrust += 1;
      if (ship.hasBackwardsThrusters && this.engine.buttonState(chem.button.KeyDown)) thrust -= 1;
      ship.setThrustInput(thrust, thrust === 0);

      ship.shootInput = this.engine.buttonState(chem.button.KeySpace) ? 1 : 0;

      this.scroll = ship.pos.minus(this.engine.size.scaled(0.5));
      this.scroll.boundMin(v());
      this.scroll.boundMax(this.mapSize.minus(this.engine.size));
    } else {
      ai.update(dt, dx);
    }
  }
}

function clickedAttackableObject(state, pos) {
  for (var id in state.physicsObjects) {
    var obj = state.physicsObjects[id];
    if (!obj.canBeShot) continue;
    if (obj.pos.distance(pos) < obj.radius) {
      return obj;
    }
  }
  return null;
}

function clickedSelectableObject(state, pos) {
  for (var id in state.physicsObjects) {
    var obj = state.physicsObjects[id];
    if (!obj.canBeSelected) continue;
    if (obj.pos.distance(pos) < obj.radius) {
      return obj;
    }
  }
  return null;
}

function clickedAiShip(state, pos) {
  for (var id in state.aiObjects) {
    var ai = state.aiObjects[id];
    if (ai.ship.pos.distance(pos) < ai.ship.radius) {
      return ai;
    }
  }
  return null;
}

State.prototype.mousePos = function() {
  return this.engine.mousePos.plus(this.scroll);
};

State.prototype.capScrollPosition = function() {
  this.scroll.boundMin(v());
  this.scroll.boundMax(this.mapSize.minus(this.engine.size));
};

State.prototype.generateStars = function() {
  var unseenMapSize = this.mapSize.minus(this.engine.size);
  this.bgBackSize = unseenMapSize.scaled(this.bgBackFactor).add(this.engine.size);
  this.bgForeSize = unseenMapSize.scaled(this.bgForeFactor).add(this.engine.size);
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

State.prototype.load = function(level) {

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
      case "Meteor":
        this.addMeteor(props);
        break;
      case "MeteorCluster":
        this.addMeteorCluster(props);
        break;
      case "Portal":
        this.addPortal(props);
        break;
      default:
        throw new Error("unrecognized object type in level: " + obj.type);
    }
  }
};

State.prototype.addPortal = function(o) {
  this.addPhysicsObject(new Portal(this, {
    pos: v(o.pos),
  }));
};

State.prototype.addMeteorCluster = function(o) {
  var pos = v(o.pos);
  var size = v(o.size);
  var minVel = v(o.minVel);
  var velRange = v(o.maxVel).minus(minVel);
  var rotVelRange = o.maxRotVel - o.minRotVel;
  var radiusRange = o.maxRadius - o.minRadius;
  for (var i = 0; i < o.count; i += 1) {
    this.addPhysicsObject(new Meteor(this, {
      pos: pos.offset(Math.random() * size.x, Math.random() * size.y),
      vel: minVel.offset(Math.random() * velRange.x, Math.random() * velRange.y),
      rotVel: o.minRotVel + Math.random() * rotVelRange,
      animationName: o.animationNames[Math.floor(Math.random() * o.animationNames.length)],
      radius: o.minRadius + Math.random() * radiusRange,
    }));
  }
};

State.prototype.addMeteor = function(o) {
  o.pos = v(o.pos);
  o.vel = v(o.vel);
  var meteor = new Meteor(this, o);
  this.addPhysicsObject(meteor);
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
  this.unselect(o);
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

State.prototype.createExplosion = function(pos, vel, animationName) {
  var explosion = new Fx(this, {
    pos: pos,
    vel: vel,
    animationName: animationName,
    duration: 0.6,
  });
  this.addPhysicsObject(explosion);
  if (animationName === 'explosion') {
    sfx.explosion();
  } else if (animationName === 'disintegrate') {
    sfx.disintegrate();
  }
};

State.prototype.addBullet = function(bullet) {
  this.addPhysicsObject(bullet);
};

State.prototype.isOffscreen = function(pos) {
  return (pos.x < 0 || pos.x > this.mapSize.x || pos.y < 0 || pos.y > this.mapSize.y);
};

State.prototype.deleteSelectedShips = function() {
  for (var id in this.selection) {
    var obj = this.selection[id];
    if (obj.team !== PLAYER_TEAM) continue;
    obj.hit(99999, "explosion");
  }
};

State.prototype.selectedUnitsAttack = function(target) {
  for (var id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (! ai.ship.selected) continue;
    ai.commandToAttack(target);
  }
};

State.prototype.sendSelectedUnitsTo = function(pt, queue, loose) {
  var squad = new ScatterSquad(pt);
  if (loose) squad.loose = true;
  for (var id in this.aiObjects) {
    var ai = this.aiObjects[id];
    if (! ai.ship.selected) continue;
    squad.add(ai);
  }
  squad.command(queue);
};

State.prototype.flagShipDestroyed = function(ship) {
  this.delete();
  if (ship.team === PLAYER_TEAM) {
    this.game.showGameOverScreen();
  } else {
    this.game.showCredits();
  }
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


