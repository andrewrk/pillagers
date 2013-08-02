var chem = require('chem');
var v = chem.vec2d;
var ani = chem.resources.animations;
var Squad = require('./squad');
var sfx = require('./sfx');
var shipTypes = require('./ship_types');

module.exports = LevelCompleteScreen;

function LevelCompleteScreen(game, o) {
  this.game = game;
  this.engine = game.engine;
  this.levelCompleteImg = chem.resources.images['level-complete.png'];
  this.batch = new chem.Batch();
  this.convoy = o.convoy;

  this.setUpConvoy(o.convoy);
  this.setUpStats(o.stats);
  this.setUpRewards(o.rewards);

  this.nextLevelPos = v(60, 550);
  this.nextLevelSize = v(200, 40);
  this.nextLevelMouseOver = false;
  var label = new chem.Label("Next Level", {
    pos: this.nextLevelPos.plus(this.nextLevelSize.scaled(0.5)),
    fillStyle: "#000000",
    font: "20px sans-serif",
    batch: this.batch,
    textAlign: 'center',
    textBaseline: 'middle',
  });

  sfx.missionComplete();
  this.game.stallMusic(3.5);
}

LevelCompleteScreen.prototype.setUpRewards = function(rewards) {
  var nextPt = v(40, 500);
  for (var i = 0; i < rewards.length; i += 1) {
    var reward = rewards[i];
    var props = reward.properties;
    var sprite, label;
    switch (reward.type) {
      case "Cash":
        // give reward
        this.game.cash += props.amount;

        sprite = new chem.Sprite(ani.coin, {
          pos: nextPt.clone(),
          zOrder: 1,
          batch: this.batch,
          scale: v(0.5, 0.5),
        });
        label = new chem.Label("You have earned " + props.amount + " cash.", {
          pos: nextPt.offset(sprite.getSize().x / 2 + 10, 0),
          zOrder: 1,
          fillStyle: "#ffffff",
          font: "20px sans-serif",
          batch: this.batch,
          textAlign: 'left',
          textBaseline: 'middle',
        });
        nextPt.y += 30;
        break;
      case "UnlockShip":
        // give reward
        this.game.unlockedShips[props.shipType] = true;

        var ShipType = shipTypes[props.shipType];
        var animationName = ShipType.prototype.animationNames.still;
        sprite = new chem.Sprite(ani[animationName], {
          pos: nextPt.clone(),
          zOrder: 1,
          batch: this.batch,
        });
        label = new chem.Label("You have unlocked the " + ShipType.prototype.name + " ship.", {
          pos: nextPt.offset(sprite.getSize().x / 2 + 10, 0),
          zOrder: 1,
          fillStyle: "#ffffff",
          font: "20px sans-serif",
          batch: this.batch,
          textAlign: 'left',
          textBaseline: 'middle',
        });
        nextPt.y += 30;
        break;
      default:
        throw new Error("unsupported reward type: " + reward.type);
    }
  }
};

LevelCompleteScreen.prototype.setUpConvoy = function(convoy) {
  var convoyCenter = v(this.engine.size.x / 2, 300);
  var label = new chem.Label("Your convoy:", {
    pos: v(convoyCenter.x, 150),
    fillStyle: "#ffffff",
    font: "14px sans-serif",
    batch: this.batch,
    textAlign: 'center',
    textBaseline: 'middle',
  });

  var squad = new Squad(convoyCenter);
  convoy.forEach(function(ship) {
    ship.pos = v(0, convoyCenter.y);
    squad.add(ship);
  });
  squad.calculate();
  squad.units.forEach(function(ship) {
    var sprite = new chem.Sprite(ani[ship.animationNames.still], {
      pos: squad.positions[ship.id],
      rotation: squad.direction.angle() + Math.PI / 2,
      batch: this.batch,
    });
  }.bind(this));

}

LevelCompleteScreen.prototype.setUpStats = function(stats) {
  var captions = {
    shipsLost: "Ships lost: ",
    shipsGained: "Ships gained: ",
    enemiesDestroyed: "Enemies destroyed: ",
  };
  var nextPt = v(150, 400);
  for (var id in captions) {
    var stat = stats[id];
    var caption = captions[id];
    var label = new chem.Label(caption + stat, {
      pos: nextPt.clone(),
      fillStyle: "#ffffff",
      font: "14px sans-serif",
      zOrder: 1,
      batch: this.batch,
      textAlign: 'right',
      textBaseline: 'top',
    });
    nextPt.y += 20;
  }
};

LevelCompleteScreen.prototype.start = function() {
  this.engine.on('update', onUpdate.bind(this));
  this.engine.on('draw', onDraw.bind(this));
  this.engine.on('mousemove', onMouseMove.bind(this));
  this.engine.on('buttondown', onButtonDown.bind(this));
};

function onUpdate(dt, dx) {
}

function onDraw(context) {
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.fillStyle = "#000000";
  context.fillRect(0, 0, this.engine.size.x, this.engine.size.y);
  context.drawImage(this.levelCompleteImg, this.engine.size.x / 2 - this.levelCompleteImg.width / 2, 10);

  context.strokeStyle = "#000000";
  context.lineWidth = 2;
  context.fillStyle = this.nextLevelMouseOver ? "#A2B3E9" : "#EEEEEC";
  context.fillRect(this.nextLevelPos.x, this.nextLevelPos.y, this.nextLevelSize.x, this.nextLevelSize.y);
  context.strokeRect(this.nextLevelPos.x, this.nextLevelPos.y, this.nextLevelSize.x, this.nextLevelSize.y);

  this.batch.draw(context);

}

function onMouseMove() {
  this.nextLevelMouseOver = this.engine.mousePos.x >= this.nextLevelPos.x &&
                            this.engine.mousePos.y >= this.nextLevelPos.y &&
                            this.engine.mousePos.x < this.nextLevelPos.x + this.nextLevelSize.x &&
                            this.engine.mousePos.y < this.nextLevelPos.y + this.nextLevelSize.y;
}

function onButtonDown(button) {
  if ((this.nextLevelMouseOver && button === chem.button.MouseLeft) ||
      button === chem.button.KeyEscape || button === chem.button.KeyEnter)
  {
    this.playNextLevel();
  }
}

LevelCompleteScreen.prototype.delete = function() {
  this.engine.removeAllListeners();
};

LevelCompleteScreen.prototype.playNextLevel = function() {
  this.delete();
  this.game.levelIndex += 1;
  this.game.playLevel(this.convoy);
};
