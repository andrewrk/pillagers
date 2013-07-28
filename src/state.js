var chem = require('chem');
var v = chem.vec2d;

var ShipAi = require('./ship_ai');
var Fx = require('./fx');
var sfx = require('./sfx');
var team = require('./team');
var Meteor = require('./meteor');
var Portal = require('./portal');
var Squad = require('./squad');
var shipTypes = require('./ship_types');

var SCROLL_SPEED = 12;
var BATTLE_MUSIC_VIOLENCE_LEVEL = 4;
var VIOLENCE_EXPIRE_TIME = 5;

var shipTypeList = toList(shipTypes);

module.exports = State;

// this class should be named LevelPlayer
function State(game) {
  this.game = game;
  this.engine = game.engine;
  this.physicsObjects = [];
  this.aiObjects = [];
  this.selection = {};
  this.selectedCount = 0;
  this.announcements = [];
  this.cashEffects = [];
  this.timers = [];
  this.triggers = [];
  this.teamCounts = {};
  this.manualOverride = null;
  this.scroll = v();
  // increases when violent things happen.
  // slowly decreases over time.
  // informs when the music changes.
  // reset on level load.
  this.violenceLevel = 0;
  this.batchBgBack = new chem.Batch();
  this.batchBgFore = new chem.Batch();
  this.batch = new chem.Batch();
  this.batchStatic = new chem.Batch();

  this.sandboxMode = false;
  this.campaignMode = true;
  this.sandboxDrawMode = 'select';
  this.sandboxDrawModeShipIndex = 0;

  this.bgBackFactor = 0.10; // scrolls 10x slower than normal
  this.bgForeFactor = 0.15;
  this.mouseDownStart = null;
  this.mouseDownOnMiniMap = false;
  this.mouseDownOnUi = false;
  this.mouseDownOnButton = null;
  this.mouseRightDownUi = false;
  this.mouseRightDownOnButton = null;
  this.mapSize = null; // set when loading map
  this.uiPaneImg = chem.resources.images['ui-pane.png'];
  this.uiPanePos = v(0, this.engine.size.y - this.uiPaneImg.height);
  this.uiPaneSize = v(this.engine.size.x, this.engine.size.y - this.uiPanePos.y);
  this.viewSize = this.engine.size.offset(0, -this.uiPaneImg.height);

  this.paused = false;
  var fpsLabel = this.engine.createFpsLabel();
  this.batchStatic.add(fpsLabel);
  this.pausedLabel = new chem.Label("PAUSED", {
    pos: this.viewSize.scaled(0.5),
    zOrder: 1,
    fillStyle: "#ffffff",
    font: "24px monospace",
    batch: this.batch,
    textAlign: 'center',
    textBaseline: 'middle',
    visible: false,
  });
  this.batchStatic.add(this.pausedLabel);

  this.stats = {
    shipsLost: 0,
    shipsGained: 0,
    enemiesDestroyed: 0,
  };
  this.playerTeam = team.get(0);
  this.enemyTeam = team.get(1);

}

State.prototype.delete = function() {
  this.clearSelection();
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    obj.delete();
  }
  this.engine.removeAllListeners();
};

State.prototype.announce = function(text) {
  this.announcements.unshift(new Announcement(this, text));
  this.announcements = this.announcements.filter(function(announcement) {
    return !announcement.deleted;
  });
  var margin = 4;
  var y = this.viewSize.y - margin;
  for (var i = 0; i < this.announcements.length; i += 1) {
    var announcement = this.announcements[i];
    announcement.label.pos = v(margin, y);
    y -= announcement.height - margin;
  }
};

State.prototype.finishLevel = function(convoy) {
  this.delete();
  this.game.showLevelComplete({
    convoy: convoy,
    stats: this.stats,
    rewards: this.victoryRewards,
  });
};

State.prototype.start = function() {
  this.engine.on('update', onUpdate.bind(this));
  this.engine.on('buttondown', onButtonDown.bind(this));
  this.engine.on('buttonup', onButtonUp.bind(this));
  this.engine.on('mousemove', onMouseMove.bind(this));
  this.engine.on('draw', onDraw.bind(this));
}

function startBoundingBox(state) {
  state.mouseDownStart = state.mousePos();
}

function finishBoundingBox(state) {
  var start = state.mouseDownStart;
  var end = state.mousePos();
  state.mouseDownStart = null;

  if (start) {
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
  }

  if (! state.engine.buttonState(chem.button.KeyCtrl) &&
      ! state.engine.buttonState(chem.button.KeyShift))
  {
    state.clearSelection();
  }

  if (! start || end.minus(start).length() < 4) {
    var clickedObj = clickedSelectableObject(state, end);
    if (clickedObj) state.select(clickedObj);
    return;
  }

  if (start) {
    // iterate over owned objects
    for (var i = 0; i < state.aiObjects.length; i += 1) {
      var ai = state.aiObjects[i];
      if (ai.ship.team !== state.playerTeam) continue;
      if (ai.ship.pos.x >= start.x && ai.ship.pos.x < end.x &&
          ai.ship.pos.y >= start.y && ai.ship.pos.y < end.y)
      {
        state.select(ai.ship);
      }
    }
  }

  state.updateUiPane();
}

State.prototype.clearSelection = function() {
  for (var id in this.selection) {
    this.unselect(this.selection[id]);
  }
  assert(this.selectedCount === 0);
  this.updateUiPane();
};

State.prototype.select = function (obj) {
  if (obj.id in this.selection) return;
  obj.selected = true;
  this.selection[obj.id] = obj;
  this.selectedCount += 1;
  this.sandboxDrawMode = 'select';
  this.updateUiPane();
}

State.prototype.unselect = function (obj) {
  if (obj.id in this.selection) {
    obj.selected = false;
    delete this.selection[obj.id];
    this.selectedCount -= 1;
    this.updateUiPane();
  }
}

State.prototype.getFirstSelected = function() {
  for (var id in this.selection) {
    return this.selection[id];
  }
  return null;
};

State.prototype.clearDockedShipSprites = function() {
  for (var i = 0; i< this.dockedShipSprites.length; i += 1) {
    this.dockedShipSprites[i].sprite.delete();
  }
  this.dockedShipSprites = [];
};

State.prototype.clearUiButtons = function() {
  for (var i = 0; i< this.uiButtons.length; i += 1) {
    this.uiButtons[i].label.delete();
  }
  this.uiButtons = [];
};

State.prototype.sandboxModeUpdateUiPane = function() {
  if (this.selectedCount === 0) {
    this.createSandboxButtons();
  }
};

State.prototype.campaignUpdateUiPane = function() {
  this.skippableLevelLabel.setVisible(this.skippable);
};

State.prototype.updateUiPane = function () {
  this.clearDockedShipSprites();
  this.clearUiButtons();
  this.selectionUiLabel.setVisible(false);
  this.selectionUiSprite.setVisible(false);
  if (this.selectedCount === 1) {
    var obj = this.getFirstSelected();
    this.selectionUiLabel.text = obj.name;
    this.selectionUiLabel.setVisible(true);

    this.selectionUiSprite.setAnimationName(obj.uiAnimationName);
    var desiredSize = this.uiPaneInfoSize.scaled(0.75);
    var scale = desiredSize.div(this.selectionUiSprite.size);
    scale.x = Math.min(scale.x, scale.y);
    scale.y = scale.x;
    this.selectionUiSprite.scale = scale;
    this.selectionUiSprite.setVisible(true);

    if (obj.canBeEntered) this.setUpDockedShipsUi(obj);
    if (obj.uiButtons) this.setUpObjectButtonsUi(obj);
  }
  if (this.sandboxMode) {
    this.sandboxModeUpdateUiPane();
  } else if (this.campaignMode) {
    this.campaignUpdateUiPane();
  }
};

State.prototype.isShipUnlocked = function(shipTypeName) {
  return this.sandboxMode || this.game.unlockedShips[shipTypeName];
}

State.prototype.setUpObjectButtonsUi = function(obj) {
  var buttonSize = v(120, 30);
  var margin = 4;
  var nextPos = this.miniMapPos.offset(-this.uiPaneMargin - buttonSize.x, 0);
  for (var i in obj.uiButtons) {
    var uiButton = obj.uiButtons[i];
    if (uiButton.shipTypeLock) {
      if (!this.isShipUnlocked(uiButton.shipTypeLock)) {
        // ship is locked. don't show the button
        continue
      }
    }
    var caption = uiButton.caption;
    if (uiButton.cost) caption = "($" + uiButton.cost + ") " + caption;
    var label = new chem.Label(caption, {
      pos: nextPos.plus(buttonSize.scaled(0.5)),
      fillStyle: "#000000",
      font: "12px sans-serif",
      batch: this.batchStatic,
      textAlign: 'center',
      textBaseline: 'middle',
    });
    this.uiButtons.push({
      pos: nextPos.clone(),
      size: buttonSize,
      button: uiButton,
      label: label,
      mouseOver: false,
    });
    nextPos.y += buttonSize.y + margin;
    if (nextPos.y + buttonSize.y >= this.miniMapPos.y + this.miniMapSize.y) {
      nextPos.y = this.miniMapPos.y;
      nextPos.x -= buttonSize.x + margin;
    }
  }
}

State.prototype.setUpDockedShipsUi = function(obj) {
  var dockItemSize = v(20, 20);
  var margin = 4;
  var nextPos = this.uiPaneDockedPos.plus(dockItemSize.scaled(0.5));
  for (var id in obj.shipsInside) {
    var dockedShip = obj.shipsInside[id];
    var sprite = new chem.Sprite(dockedShip.animationNames.still, {
      batch: this.batchStatic,
      loop: false,
      pos: nextPos.clone(),
    });
    sprite.scale = dockItemSize.divBy(sprite.size);
    sprite.scale.x = Math.min(sprite.scale.x, sprite.scale.y);
    sprite.scale.y = sprite.scale.x;
    this.dockedShipSprites.push({
      ship: dockedShip,
      sprite: sprite
    });
    nextPos.y += dockItemSize.y + margin;
    if (nextPos.y + dockItemSize.y * 0.5 >= this.uiPaneDockedPos.y + this.uiPaneDockedSize.y) {
      nextPos.y = this.uiPaneDockedPos.y + dockItemSize.y * 0.5;
      nextPos.x += dockItemSize.x + margin;
    }
  }
}

function clearSelection(state) {
  state.aiObjects.forEach(function(ai) {
    ai.deselect();
  });
}

State.prototype.manualOverrideClick = function() {
  var aiShip = clickedAiShip(this, this.mousePos());
  if (aiShip) {
    this.beginManualOverride(aiShip);
  } else {
    this.endManualOverride();
  }
}

State.prototype.togglePause = function() {
  this.paused = !this.paused;
  this.pausedLabel.setVisible(this.paused);
}

State.prototype.placeMeteorAtCursor = function() {
  var meteor = this.addMeteor({
    pos: this.mousePos(),
    vel: v(0, 0),
    animationName: 'rock-a',
    radius: 64,
  });
  meteor.uiButtons = [
    {
      caption: "+y vel",
      fn: updateVelFn(v(0, 0.05)),
    },
    {
      caption: "-y vel",
      fn: updateVelFn(v(0, -0.05)),
    },
    {
      caption: "+x vel",
      fn: updateVelFn(v(0.05, 0)),
    },
    {
      caption: "-x vel",
      fn: updateVelFn(v(-0.05, 0)),
    },
    {
      caption: "+radius",
      fn: updateRadiusFn(10),
    },
    {
      caption: "-radius",
      fn: updateRadiusFn(-10),
    },
  ];
  function updateVelFn(delta) {
    return function() {
      meteor.vel.add(delta);
    }
  }
  function updateRadiusFn(delta) {
    return function() {
      meteor.setRadius(meteor.radius + delta);
    }
  }
}

State.prototype.placeShipClusterAtCursor = function() {
  var o = {
    type: shipTypeList[this.sandboxDrawModeShipIndex].key,
    pos: this.mousePos(),
    team: this.playerTeam,
    count: 10,
    size: v(100, 100),
  };
  this.addShipCluster(o);
}

State.prototype.placeShipAtCursor = function() {
  var ShipType = shipTypeList[this.sandboxDrawModeShipIndex].value;
  var ship = new ShipType(this, {team: this.playerTeam, pos: this.mousePos()});
  this.addShip(ship);
}

function sendUnitsToCursor(state) {
  var shiftHeld = state.engine.buttonState(chem.button.KeyShift);
  var altHeld = state.engine.buttonState(chem.button.KeyCtrl);
  state.sendSelectedUnitsTo(state.mousePos(), shiftHeld, altHeld);
}

function onButtonDown(button) {
  switch (button) {
    case chem.button.MouseLeft:
      if (this.engine.mousePos.x >= this.miniMapPos.x &&
          this.engine.mousePos.x < this.miniMapPos.x + this.miniMapSize.x &&
          this.engine.mousePos.y >= this.miniMapPos.y &&
          this.engine.mousePos.y < this.miniMapPos.y + this.miniMapSize.y)
      {
        this.mouseDownOnMiniMap = true;
        this.mouseDownOnUi = true;
        this.setScrollFromMiniMap();
        return;
      }
      if (this.engine.mousePos.y >= this.uiPanePos.y) {
        this.mouseDownOnUi = true;
        this.mouseDownOnButton = this.getMouseOverButton();
        return;
      }
      if (this.engine.buttonState(chem.button.Key0)) {
        this.toggleSandboxMode();
        return;
      }
      if (this.sandboxMode) {
        this.sandboxLeftClick();
        return;
      }
      if (this.engine.buttonState(chem.button.KeyU)) {
        this.cheatUnlockEverything();
        return;
      }
      if (this.engine.buttonState(chem.button.KeyC)) {
        this.game.cash += 500;
        return;
      }
      if (this.engine.buttonState(chem.button.KeyN)) {
        this.cheatSkipLevel();
        return;
      }
      startBoundingBox(this);
      break;
    case chem.button.MouseRight:
      if (this.engine.mousePos.y >= this.uiPanePos.y) {
        this.mouseRightDownUi = true;
        this.mouseRightDownOnButton = this.getMouseOverButton();
        return;
      }
      if (this.engine.buttonState(chem.button.Key1) || this.engine.buttonState(chem.button.Key2)) {
        this.placeShipAtCursor();
        return;
      }
      var obj = clickedAttackableObject(this, this.mousePos());
      if (obj && obj.team !== this.playerTeam) {
        this.selectedUnitsAttack(obj);
        return;
      }
      obj = clickedEnterableObject(this, this.mousePos());
      if (obj) {
        this.selectedUnitsEnter(obj);
        return;
      }
      sendUnitsToCursor(this);
      break;
    case chem.button.KeyA:
      if (this.engine.buttonState(chem.button.KeyCtrl)) {
        this.selectAll();
      }
      break;
    case chem.button.KeyP:
      this.togglePause();
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
      if (this.mouseDownStart) {
        finishBoundingBox(this);
      } else if (this.mouseDownOnButton) {
        this.maybeMouseUpButton();
      }
      this.mouseDownOnMiniMap = false;
      this.mouseDownOnUi = false;
      this.mouseDownOnButton = null;
      break;
    case chem.button.MouseRight:
      if (this.mouseRightDownOnButton) {
        this.maybeMouseRightUpButton();
      }
      this.mouseRightDownUi = false;
      this.mouseRightDownOnButton = null;
      break;
    case chem.button.KeyEscape:
      if (this.skippable) this.cheatSkipLevel();
  }
}

State.prototype.sandboxLeftClick = function() {
  switch (this.sandboxDrawMode) {
    case 'ship1':
      this.placeShipAtCursor();
      break;
    case 'ship10':
      this.placeShipClusterAtCursor();
      break;
    case 'select':
      startBoundingBox(this);
      break;
    case 'pilot':
      this.manualOverrideClick();
      break;
    case 'meteor':
      this.placeMeteorAtCursor();
      break;
    default:
      throw new Error("unknown draw mode: " + this.sandboxDrawMode);
  }
}

State.prototype.cheatSkipLevel = function() {
  this.finishLevel(this.getConvoy());
};

State.prototype.cheatUnlockEverything = function() {
  for (var shipType in shipTypes) {
    this.game.unlockedShips[shipType] = true;
  }
};

State.prototype.getConvoy = function() {
  return this.physicsObjects.filter(function(obj) {
    return obj.canBeSelected && obj.team === this.playerTeam;
  }.bind(this));
};

State.prototype.maybeMouseRightUpButton = function() {
  var upButton = this.getMouseOverButton();
  if (this.mouseRightDownOnButton && upButton.button === this.mouseRightDownOnButton.button) {
    var help = upButton.button.help || "There is no help text for that button.";
    this.announce(help);
  }
};

State.prototype.maybeMouseUpButton = function() {
  var upButton = this.getMouseOverButton();
  if (this.mouseDownOnButton && upButton.caption === this.mouseDownOnButton.caption) {
    if (this.campaignMode) {
      if (upButton.button.cost) {
        if (this.game.cash < upButton.button.cost) {
          this.announce("This is not enough Golds.");
          return;
        }
        this.spendCash(upButton.button.cost);
      }
    }
    upButton.button.fn(upButton);
  }
};

State.prototype.createCashEffect = function(pos, batch, amount) {
  var cashEffect = new CashEffect(batch, pos, amount);
  this.cashEffects.push(cashEffect);
  this.cashEffects = this.cashEffects.filter(function(cashEffect) {
    return !cashEffect.deleted;
  });
};

State.prototype.gainCash = function(pos, amount) {
  this.game.cash += amount;
  this.createCashEffect(pos, this.batch, amount);
}

State.prototype.spendCash = function(amount) {
  this.game.cash -= amount;
  this.createCashEffect(this.coinSprite.pos.clone(), this.batchStatic, -amount);
}

function onMouseMove() {
  if (this.mouseDownOnMiniMap) {
    this.setScrollFromMiniMap();
    return;
  }
  this.computeHoverForUiButtons();
}

State.prototype.getMouseOverButton = function() {
  for (var i = 0; i < this.uiButtons.length; i += 1) {
    var uiBtn = this.uiButtons[i];
    if (this.engine.mousePos.x >= uiBtn.pos.x &&
        this.engine.mousePos.y >= uiBtn.pos.y &&
        this.engine.mousePos.x < uiBtn.pos.x + uiBtn.size.x &&
        this.engine.mousePos.y < uiBtn.pos.y + uiBtn.size.y)
    {
      return uiBtn;
    }
  }
  return null;
};

State.prototype.computeHoverForUiButtons = function() {
  for (var i = 0; i < this.uiButtons.length; i += 1) {
    var uiBtn = this.uiButtons[i];
    uiBtn.mouseOver = this.engine.mousePos.x >= uiBtn.pos.x &&
                      this.engine.mousePos.y >= uiBtn.pos.y &&
                      this.engine.mousePos.x < uiBtn.pos.x + uiBtn.size.x &&
                      this.engine.mousePos.y < uiBtn.pos.y + uiBtn.size.y;
  }
};

State.prototype.setScrollFromMiniMap = function() {
  var centerPt = this.engine.mousePos.minus(this.miniMapPos).divBy(this.miniMapSize).mult(this.mapSize);
  this.scroll = centerPt.minus(this.viewSize.scaled(0.5));
  this.capScrollPosition();
}

function onDraw(context) {
  // clear canvas to black
  context.fillStyle = '#000000';
  context.fillRect(0, 0, this.viewSize.x, this.viewSize.y);

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
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    if (obj.deleted) continue;
    obj.draw(context);
  }
  for (i = 0; i < this.aiObjects.length; i += 1) {
    var ai = this.aiObjects[i];
    ai.draw(context);
  }

  // draw a selection box
  if (this.mouseDownStart) {
    var size = this.mousePos().minus(this.mouseDownStart);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.strokeRect(this.mouseDownStart.x, this.mouseDownStart.y, size.x, size.y);
  }

  // static stuff
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  this.drawUiPane(context);
  this.batchStatic.draw(context);
}

State.prototype.drawUiPane = function(context) {
  // (0, 0) is top left of ui pane
  // bg
  context.drawImage(this.uiPaneImg, this.uiPanePos.x, this.uiPanePos.y);

  // ui buttons
  this.drawUiButtons(context);

  // mini map
  // fill bg with black
  context.fillStyle = "#000000";
  context.fillRect(this.miniMapPos.x, this.miniMapPos.y, this.miniMapSize.x, this.miniMapSize.y);
  // draw circles for physics objects
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    if (obj.deleted) continue;
    if (!obj.miniMapColor) continue;
    var pos = obj.pos.divBy(this.mapSize).mult(this.miniMapSize).add(this.miniMapPos);
    var radius = obj.radius / this.mapSize.x * this.miniMapSize.x;
    context.beginPath();
    context.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    context.closePath();
    context.fillStyle = obj.miniMapColor;
    context.fill();
  }
  // rectangle to represent the view area
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  var miniViewStart = this.scroll.divBy(this.mapSize).mult(this.miniMapSize).add(this.miniMapPos);
  var miniViewSize = this.viewSize.divBy(this.mapSize).mult(this.miniMapSize);
  context.strokeRect(miniViewStart.x, miniViewStart.y, miniViewSize.x, miniViewSize.y);
}

State.prototype.drawUiButtons = function(context) {
  for (var i = 0; i < this.uiButtons.length; i += 1) {
    var uiBtn = this.uiButtons[i];
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.fillStyle = uiBtn.mouseOver ? "#A2B3E9" : "#EEEEEC";
    context.fillRect(uiBtn.pos.x, uiBtn.pos.y, uiBtn.size.x, uiBtn.size.y);
    context.strokeRect(uiBtn.pos.x, uiBtn.pos.y, uiBtn.size.x, uiBtn.size.y);
  }
};

function onUpdate(dt, dx) {
  var goUp = this.engine.buttonState(chem.button.KeyUp) || this.engine.buttonState(chem.button.KeyW);
  var goDown = this.engine.buttonState(chem.button.KeyDown) || this.engine.buttonState(chem.button.KeyS);
  var goLeft = this.engine.buttonState(chem.button.KeyLeft) || this.engine.buttonState(chem.button.KeyA);
  var goRight = this.engine.buttonState(chem.button.KeyRight) || this.engine.buttonState(chem.button.KeyD);

  if (!this.manualOverride) {
    if (goUp) this.scroll.y -= SCROLL_SPEED * dx;
    if (goDown) this.scroll.y += SCROLL_SPEED * dx;
    if (goLeft) this.scroll.x -= SCROLL_SPEED * dx;
    if (goRight) this.scroll.x += SCROLL_SPEED * dx;
  }
  this.capScrollPosition();

  if (this.paused) return;

  // end battle music if no more violence is occurring
  this.violenceTimeout -= dt;
  if (this.violenceTimeout <= 0) this.game.endBattleMusic();

  var id;
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    if (obj.deleted) continue;
    obj.update(dt, dx);
  }

  for (i = 0; i < this.aiObjects.length; i += 1) {
    var ai = this.aiObjects[i];
    if (this.manualOverride === ai.id) {
      var ship = ai.ship;
      // rotate the ship with left and right arrow keys
      ship.rotateInput = 0;
      if (goLeft) ship.rotateInput -= 1;
      if (goRight) ship.rotateInput += 1;

      // apply forward and backward thrust with up and down arrow keys
      var thrust = 0;
      if (goUp) thrust += 1;
      if (ship.hasBackwardsThrusters && goDown) thrust -= 1;
      ship.setThrustInput(thrust, thrust === 0);

      var primaryFire = this.engine.buttonState(chem.button.KeySpace) || this.engine.buttonState(chem.button.KeyJ);
      if (ship.hasBullets) {
        ship.shootInput = primaryFire;
      } else if (ship.hasMelee) {
        ship.meleeInputOn = primaryFire;
        if (primaryFire) {
          ship.meleeInput = this.nearestMeleeableShip(ship);
        } else {
          ship.meleeInput = null;
        }
      }

      this.scroll = ship.pos.minus(this.viewSize.scaled(0.5));
      this.scroll.boundMin(v());
      this.scroll.boundMax(this.mapSize.minus(this.viewSize));
    } else {
      ai.update(dt, dx);
    }
  }

  for (i = 0; i < this.announcements.length; i += 1) {
    var announcement = this.announcements[i];
    if (announcement.deleted) continue;
    announcement.addTime(dt);
  }

  for (i = 0; i < this.cashEffects.length; i += 1) {
    var cashEffect = this.cashEffects[i];
    if (cashEffect.deleted) continue;
    cashEffect.update(dt, dx);
  }

  for (i = 0; i < this.timers.length; i += 1) {
    var timer = this.timers[i];
    if (timer.deleted) continue;
    timer.update(dt, dx);
  }

  if (this.sandboxMode) {
    this.sandboxModeUpdate(dt, dx);
  } else if (this.campaignMode) {
    this.campaignOnUpdate(dt, dx);
  }
}

State.prototype.nearestMeleeableShip = function(ship) {
  var target = null;
  var closestDist;
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    if (!obj.canBeShot) continue;
    if (obj.team == null || obj.team === ship.team) continue;
    var dist = obj.pos.distanceSqrd(ship.pos);
    if (target == null || dist < closestDist) {
      closestDist = dist;
      target = obj;
    }
  }
  return target;
};

State.prototype.sandboxModeUpdate = function(dt, dx) {
  // nothing to do
};

State.prototype.campaignOnUpdate = function(dt, dx) {
  this.cashLabel.text = this.game.cash.toString();
}

State.prototype.clickedObject = function(pos, matchFn) {
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    if (! matchFn(obj)) continue;
    if (obj.pos.distance(pos) < obj.radius) return obj;
  }
  return null;
}

function clickedAttackableObject(state, pos) {
  return state.clickedObject(pos, function(obj) { return obj.canBeShot; });
}

function clickedEnterableObject(state, pos) {
  return state.clickedObject(pos, function(obj) { return obj.canBeEntered; });
}

function clickedSelectableObject(state, pos) {
  return state.clickedObject(pos, function(obj) {
    return obj.canBeSelected || state.sandboxMode;
  });
}

function clickedAiShip(state, pos) {
  for (var i = 0; i < state.aiObjects.length; i += 1) {
    var ai = state.aiObjects[i];
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
  this.scroll.boundMax(this.mapSize.minus(this.viewSize));
};

State.prototype.generateStars = function() {
  this.batchBgBack.clear();
  this.batchBgFore.clear();

  var unseenMapSize = this.mapSize.minus(this.viewSize);
  this.bgBackSize = unseenMapSize.scaled(this.bgBackFactor).add(this.viewSize);
  this.bgForeSize = unseenMapSize.scaled(this.bgForeFactor).add(this.viewSize);
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

State.prototype.triggerEvent = function(eventName) {
  var levelEvent = this.events[eventName];
  assert(levelEvent, "Event not declared: " + eventName);
  levelEvent.actions.forEach(function(action) {
    this.performAction(action);
  }.bind(this));
};

State.prototype.performAction = function(action) {
  var props = action.properties;
  switch (action.type) {
    case "Announcement":
      this.announce(props.text);
      break;
    case "Timer":
      this.addTimer(props);
      break;
    case "EveryoneTargetThatSuckersFlagship":
      this.allEnemyShipsTargetFlagship();
      break;
    case "SpawnObject":
      this.spawnObject(props);
      break;
    case "LevelComplete":
      this.cheatSkipLevel();
      break;
    default:
      throw new Error("Unknown action type: " + action.type);
  }
}

State.prototype.addTimer = function(o) {
  var timer = new Timer(this, o.timeout, o.event);
  this.timers.push(timer);
  this.timers = this.timers.filter(function(timer) {
    return !timer.deleted;
  });
};

State.prototype.allEnemyShipsTargetFlagship = function() {
  this.aiObjects.forEach(function(ai) {
    if (ai.ship.team !== this.playerTeam) {
      ai.commandToAttack(this.getPlayerFlagship());
    }
  }.bind(this));
};

State.prototype.getPlayerFlagship = function() {
  for (var i = 0; i < this.physicsObjects.length; i += 1) {
    var obj = this.physicsObjects[i];
    if (obj.isFlagship && obj.team === this.playerTeam) {
      return obj;
    }
  }
  return null;
};

State.prototype.spawnObject = function(obj) {
  var props = obj.properties;
  switch (obj.type) {
    case "ShipCluster":
      props.team = team.get(props.team || 0);
      this.addShipCluster(props);
      break;
    case "Ship":
      this.addSpecialShip(props);
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
    case "Text":
      this.addText(props);
      break;
    default:
      throw new Error("unrecognized object type in level: " + obj.type);
  }
}

State.prototype.startSandboxMode = function() {
  this.sandboxMode = true;
  // init some default map properties
  this.setMapSize(this.viewSize.clone());
  this.setUpUi();
  this.start();
  this.announce("Right click a button to display help information.");
};

State.prototype.setMapSize = function(size) {
  size.boundMin(this.viewSize);
  this.mapSize = size;
  this.generateStars();
};

State.prototype.load = function(level, convoy) {
  this.setMapSize(v(level.size));

  this.scroll = level.scroll ? v(level.scroll) : v();
  this.victoryRewards = level.rewards;
  this.skippable = level.skippable;
  this.events = level.events;
  if (level.triggers) this.triggers = level.triggers;

  for (var i = 0; i < level.objects.length; i += 1) {
    this.spawnObject(level.objects[i]);
  }

  if (convoy) {
    this.insertConvoyAtStartPoint(convoy, level.startPoint);
  }

  if (level.immediateEvents) {
    level.immediateEvents.forEach(function(eventName) {
      this.triggerEvent(eventName);
    }.bind(this));
  }

  this.setUpUi();
};

State.prototype.insertConvoyAtStartPoint = function(convoy, o) {
  var pos = v(o.pos);
  convoy.forEach(function(ship) {
    var radius = Math.random() * o.radius;
    var radians = Math.random() * Math.PI * 2;
    var pt = v.unit(radians).scale(radius).plus(pos);
    ship.pos = pt;
    ship.vel = v();
    ship.undelete(this);
    ship.rotation = 0;
    this.addShip(ship);
  }.bind(this));
};

State.prototype.sandboxModeSetUpUi = function() {

};

State.prototype.createSandboxButtons = function() {
  var btns = [
    {
      caption: "-width",
      help: "Decrease the map width by 100.",
      fn: this.uiSizeFn(v(-100, 0)),
    },
    {
      caption: "+width",
      help: "Increase the map width by 100.",
      fn: this.uiSizeFn(v(+100, 0)),
    },
    {
      caption: "-height",
      help: "Decrease the map height by 100.",
      fn: this.uiSizeFn(v(0, -100)),
    },
    {
      caption: "+height",
      help: "Increase the map height by 100.",
      fn: this.uiSizeFn(v(0, 100)),
    },
    {
      caption: "team " + (this.playerTeam.number + 1),
      help: "Switch which team you are playing as.",
      fn: this.switchToNextTeam.bind(this),
    },
    {
      caption: shipTypeList[this.sandboxDrawModeShipIndex].key,
      help: "Switch which ship you will draw with ship 1 and ship 10 buttons.",
      fn: this.sandboxSelectNextShipType.bind(this),
    },
    {
      caption: "ship 1",
      help: "Press this button, then create ships by left clicking. Keys 1-9 determine what ship to create.",
      fn: this.setPaintModeFn("ship1"),
    },
    {
      caption: "ship 10",
      help: "Same as ship 1 but creates 10 instead of 1.",
      fn: this.setPaintModeFn("ship10"),
    },
    {
      caption: "select",
      help: "Press this button, then left clicking acts like normal - selecting ships.",
      fn: this.setPaintModeFn("select"),
    },
    {
      caption: "manual",
      help: "Press this button, then left clicking will manually pilot a ship.",
      fn: this.setPaintModeFn("pilot"),
    },
    {
      caption: "meteor",
      help: "Press this button, then left clicking will create a meteor.",
      fn: this.setPaintModeFn("meteor"),
    },
    {
      caption: "title",
      help: "Go back to the title screen.",
      fn: this.confirmBackToTitleScreen.bind(this),
    },
  ];
  var nextPos = this.uiPanePos.offset(this.uiPaneMargin, this.uiPaneMargin);
  this.uiButtons = btns.map(function(btn) {
    var size = v(50, 20);
    if (nextPos.y + size.y >= this.uiPanePos.y + this.uiPaneSize.y - this.uiPaneMargin) {
      nextPos.y = this.uiPanePos.y + this.uiPaneMargin;
      nextPos.x += size.x + 4;
    }
    var pos = nextPos.clone();
    nextPos.y += size.y + 4;
    var label = new chem.Label(btn.caption, {
      pos: pos.plus(size.scaled(0.5)),
      fillStyle: "#000000",
      font: "14px sans-serif",
      textAlign: "center",
      textBaseline: "middle",
      batch: this.batchStatic,
    });
    return {
      pos: pos,
      size: size,
      button: btn,
      label: label,
      mouseOver: false,
    };
  }.bind(this));
  this.computeHoverForUiButtons();
};

State.prototype.confirmBackToTitleScreen = function(button) {
  if (!this.engine.buttonState(chem.button.KeyShift)) {
    this.announce("Hold shift when pressing this button to confirm.");
    return;
  }
  this.delete();
  this.game.showTitleScreen();
};

State.prototype.sandboxSelectNextShipType = function(button) {
  var newIndex = (this.sandboxDrawModeShipIndex + 1) % shipTypeList.length;
  this.sandboxDrawModeShipIndex = newIndex;
  button.label.text = shipTypeList[newIndex].key;
  this.sandboxDrawMode = 'ship1';
};

State.prototype.setPaintModeFn = function(name) {
  return function(button) {
    this.sandboxDrawMode = name;
  }.bind(this);
}

State.prototype.uiSizeFn = function(delta) {
  return function(button) {
    this.setMapSize(this.mapSize.plus(delta));
  }.bind(this);
}

State.prototype.switchToNextTeam = function(button) {
  var maxTeams = 4;
  var newTeamIndex = (this.playerTeam.number + 1) % maxTeams;
  this.playerTeam = team.get(newTeamIndex);
  button.label.text = "team " + (newTeamIndex + 1);
};

State.prototype.campaignSetUpUi = function() {
  this.coinSprite = new chem.Sprite('coin', {
    pos: this.uiPaneCashPos.offset(4, 4),
    batch: this.batchStatic,
    scale: v(0.40, 0.40),
  });
  this.coinSprite.pos.add(this.coinSprite.getSize().scale(0.5));
  this.cashLabel = new chem.Label("0", {
    pos: v(this.coinSprite.getRight() + 4, this.coinSprite.pos.y),
    fillStyle: "#ffffff",
    font: "20px sans-serif",
    textAlign: "left",
    textBaseline: "middle",
    batch: this.batchStatic,
  });
  this.skippableLevelLabel = new chem.Label("You may skip this level by pressing Escape.", {
    pos: this.uiPanePos.offset(this.uiPaneMargin, this.uiPaneSize.y - this.uiPaneMargin),
    fillStyle: "#ffffff",
    font: "16px sans-serif",
    textAlign: "left",
    textBaseline: "bottom",
    batch: this.batchStatic,
    visible: false,
  });
}

State.prototype.setUpUi = function() {
  // calculate mini map coordinates
  this.uiPaneMargin = 10;
  this.miniMapSize = v();
  // choose the height and calculate the width 
  this.miniMapSize.y = this.uiPaneSize.y - this.uiPaneMargin - this.uiPaneMargin;
  this.miniMapSize.x = this.miniMapSize.y / this.mapSize.y * this.mapSize.x;
  this.miniMapPos = this.uiPanePos.offset(this.uiPaneSize.x - this.uiPaneMargin - this.miniMapSize.x, this.uiPaneMargin);

  this.uiPaneCashPos = this.uiPanePos.offset(this.uiPaneMargin, this.uiPaneMargin);
  this.uiPaneCashSize = v(60, this.uiPaneSize.y - this.uiPaneMargin * 2);

  // info pane
  this.uiPaneInfoPos = this.uiPaneCashPos.offset(this.uiPaneCashSize.x, 0);
  this.uiPaneInfoSize = v(80, this.uiPaneSize.y - this.uiPaneMargin * 2);
  this.selectionUiSprite = new chem.Sprite("knife", {
    pos: this.uiPaneInfoPos.plus(this.uiPaneInfoSize.scaled(0.5)),
    batch: this.batchStatic,
    visible: false,
    loop: false,
  });
  this.selectionUiLabel = new chem.Label("", {
    pos: this.uiPaneInfoPos.offset(this.uiPaneInfoSize.x * 0.5, this.uiPaneInfoSize.y),
    fillStyle: "#ffffff",
    zOrder: 1,
    font: "12px sans-serif",
    batch: this.batchStatic,
    textAlign: 'center',
    textBaseline: 'bottom',
    visible: false,
  });

  // docked ships
  this.uiPaneDockedPos = this.uiPaneInfoPos.offset(this.uiPaneInfoSize.x + this.uiPaneMargin, 0);
  this.uiPaneDockedSize = v(160, this.uiPaneInfoSize.y);
  this.dockedShipSprites = [];
  // ui buttons
  this.uiButtons = [];

  if (this.sandboxMode) {
    this.sandboxModeSetUpUi();
  } else if(this.campaignMode) {
    this.campaignSetUpUi();
  }
  this.updateUiPane();
};

State.prototype.addText = function(o) {
  var pt = v(o.pos);
  var lines = o.text.split("\n");
  for (var i = 0; i < lines.length; i += 1) {
    var line = lines[i];
    var label = new chem.Label(line, {
      pos: pt.clone(),
      fillStyle: "#ffffff",
      font: "16px sans-serif",
      batch: this.batch,
      textAlign: 'left',
      textBaseline: 'top',
    });
    pt.y += 20;
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
  return meteor;
};

State.prototype.addSpecialShip = function(o) {
  var ShipType = shipTypes[o.ship.type];
  var ship = new ShipType(this, {
    team: team.get(o.ship.team),
    pos: v(o.ship.pos),
  });
  if (o.triggers) {
    o.triggers.forEach(function(trigger) {
      ship.once(trigger.condition, function() {
        this.triggerEvent(trigger.event);
      }.bind(this));
    }.bind(this));
  }
  var ai = this.addShip(ship);
  if (o.manualPilot) this.beginManualOverride(ai);
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
  this.physicsObjects.push(o);
  if (o.team != null) {
    var oldCount = this.teamCounts[o.team.number];
    if (oldCount == null) oldCount = 0;
    this.teamCounts[o.team.number] = oldCount + 1;
  }
};

State.prototype.deletePhysicsObject = function(o) {
  assert(o.id);
  this.unselect(o);
  var index = this.physicsObjects.indexOf(o);
  if (index >= 0) this.physicsObjects.splice(index, 1);
  if (o.team != null) {
    this.teamCounts[o.team.number] -= 1;
    if (this.teamCounts[o.team.number] === 0) {
      this.triggerTeamDeathEvent(o.team.number);
    }
  }
  this.updateUiPane();
}

State.prototype.triggerTeamDeathEvent = function(teamNumber) {
  this.triggers.forEach(function(trigger) {
    if (trigger.type !== 'AllShipsDestroyed') return;
    if (trigger.properties.team !== teamNumber) return;
    this.triggerEvent(trigger.properties.event);
  }.bind(this));
};

State.prototype.deleteAi = function(ai) {
  if (this.manualOverride === ai.id) this.endManualOverride();
  var index = this.aiObjects.indexOf(ai);
  if (index >= 0) this.aiObjects.splice(index, 1);
};

State.prototype.addAiObject = function(o) {
  assert(o.id);
  this.aiObjects.push(o);
};

State.prototype.addShip = function(ship) {
  this.addPhysicsObject(ship);
  var shipAi = new ShipAi(this, ship);
  this.addAiObject(shipAi);
  ship.on('destroyed', function() {
    if (ship.team === this.playerTeam) {
      this.addViolence(4);
      this.stats.shipsLost += 1;
    } else {
      this.stats.enemiesDestroyed += 1;
      this.gainCash(ship.pos, ship.bounty);
    }
  }.bind(this));
  ship.on('targeted', function(otherShip, action) {
    if (action === 'attack' && ship.team === this.playerTeam) {
      this.addViolence(1);
    }
  }.bind(this));
  ship.on('hit', function(otherShip, action) {
    if (action === 'attack' && ship.team === this.playerTeam) {
      this.addViolence(2);
    }
  }.bind(this));
  return shipAi;
};

State.prototype.addViolence = function(amount) {
  this.violenceTimeout = VIOLENCE_EXPIRE_TIME;
  this.violenceLevel += amount;
  if (this.violenceLevel >= BATTLE_MUSIC_VIOLENCE_LEVEL) {
    this.game.beginBattleMusic();
  }
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
  if (bullet.team !== this.playerTeam) this.addViolence(1);
  this.addPhysicsObject(bullet);
};

State.prototype.isOffscreen = function(pos) {
  return (pos.x < 0 || pos.x > this.mapSize.x || pos.y < 0 || pos.y > this.mapSize.y);
};

State.prototype.canDeleteObj = function(obj) {
  return obj.team === this.playerTeam || this.sandboxMode;
}

State.prototype.deleteSelectedShips = function() {
  for (var id in this.selection) {
    var obj = this.selection[id];
    if (! this.canDeleteObj(obj)) continue
    obj.hit(99999, "explosion");
  }
};

State.prototype.selectAll = function() {
  this.aiObjects.forEach(function(ai) {
    if (ai.ship.team === this.playerTeam) {
      this.select(ai.ship);
    }
  }.bind(this));
};

State.prototype.commandableSelected = function(cb) {
  this.aiObjects.filter(function(ai) {
    return ai.ship.selected && ai.ship.team === this.playerTeam;
  }.bind(this)).map(cb);
};

State.prototype.selectedUnitsEnter = function(target) {
  this.commandableSelected(function(ai) {
    ai.commandToEnter(target);
  });
};

State.prototype.selectedUnitsAttack = function(target) {
  this.commandableSelected(function(ai) {
    ai.commandToAttack(target);
  });
};

State.prototype.sendSelectedUnitsTo = function(pt, queue, loose) {
  var squad = new ScatterSquad(pt);
  if (loose) squad.loose = true;
  this.commandableSelected(function(ai) {
    squad.add(ai);
  });
  squad.command(queue);
};

State.prototype.gameOver = function() {
  this.delete();
  this.game.showGameOverScreen();
};

State.prototype.flagShipDestroyed = function(ship) {
  if (!this.campaignMode) return;

  if (ship.team === this.playerTeam) {
    this.gameOver();
  } else {
    this.addPortal({pos: ship.pos.clone()});
  }
};

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}


function ScatterSquad(dest) {
  this.shipToAi = {};
  this.loose = false;
  this.squad = new Squad(dest);
}

ScatterSquad.prototype.add = function(ai) {
  this.shipToAi[ai.ship.id] = ai;
  this.squad.add(ai.ship);
};

ScatterSquad.prototype.command = function(queue) {
  this.squad.calculate();
  for (var i = 0; i < this.squad.units.length; i += 1) {
    var ship = this.squad.units[i];
    var unit = this.shipToAi[ship.id];
    unit.commandToMove(this.squad.positions[ship.id], queue, this.loose);
    if (! this.loose) unit.commandToPoint(this.squad.direction, true);
  }
};

function Announcement(state, text) {
  this.age = 0;
  this.label = new chem.Label(text, {
    zOrder: 1,
    fillStyle: "#ffffff",
    font: "14px sans-serif",
    batch: state.batchStatic,
    textAlign: 'left',
    textBaseline: 'bottom',
  });
  this.height = 20;
  this.fadeDuration = 6;
  this.duration = 8;
  this.deleted = false;
}

Announcement.prototype.addTime = function(dt) {
  this.age += dt;
  if (this.age > this.duration) {
    this.label.delete();
    this.deleted = true;
    return;
  }
  if (this.age > this.fadeDuration) {
    var alphaDuration = this.duration - this.fadeDuration;
    this.label.alpha = 1 - (this.age - this.fadeDuration) / alphaDuration;
  }
};

function CashEffect(batch, pos, amount) {
  var amountStr = amount.toString();
  if (amount > 0) amountStr = "+" + amountStr;
  this.label = new chem.Label(amountStr, {
    pos: pos.clone(),
    fillStyle: amount >= 0 ? "#029200" : "#FF0000",
    font: "28px sans-serif",
    textAlign: "center",
    textBaseline: "middle",
    batch: batch,
    zOrder: 1,
  });
  this.vel = v(0, -0.4);
  // I love this variable name
  this.alphaDelta = 0.02;
  this.deleted = false;
}

CashEffect.prototype.update = function(dt, dx) {
  this.label.pos.add(this.vel.scaled(dx));
  this.label.alpha = Math.max(0, this.label.alpha - dx * this.alphaDelta);
  if (this.label.alpha === 0) this.delete();
};

CashEffect.prototype.delete = function() {
  this.label.delete();
  this.deleted = true;
};

function Timer(state, timeout, eventName) {
  this.state = state;
  this.timeLeft = timeout;
  this.eventName = eventName;
  this.deleted = false;
}

Timer.prototype.update = function(dt, dx) {
  this.timeLeft -= dt;
  if (this.timeLeft <= 0) {
    this.deleted = true;
    this.state.triggerEvent(this.eventName);
  }
};

function toList(o) {
  var arr = [];
  for (var key in o) {
    arr.push({key: key, value: o[key]});
  }
  return arr;
}

