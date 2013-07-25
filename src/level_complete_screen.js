var chem = require('chem');
var v = chem.vec2d;
var Squad = require('./squad');

module.exports = LevelCompleteScreen;

function LevelCompleteScreen(game, convoy) {
  this.game = game;
  this.engine = game.engine;
  this.levelCompleteImg = chem.resources.images['level-complete.png'];
  this.batch = new chem.Batch();


  var label;
  var convoyCenter = v(this.engine.size.x / 2, 200);
  label = new chem.Label("Your convoy:", {
    pos: v(50, convoyCenter.y),
    fillStyle: "#ffffff",
    font: "14px sans-serif",
    batch: this.batch,
    textAlign: 'left',
    textBaseline: 'middle',
  });

  // turn convoy into an array and sort by rankOrder
  var squad = new Squad(convoyCenter);
  for (var id in convoy) {
    var ship = convoy[id];
    ship.pos = v(0, convoyCenter.y);
    squad.add(ship);
  }
  squad.calculate();
  squad.units.forEach(function(ship, index) {
    var sprite = new chem.Sprite(ship.animationNames.still, {
      pos: squad.positions[index],
      rotation: squad.direction.angle() + Math.PI / 2,
      batch: this.batch,
    });
  }.bind(this));
}

LevelCompleteScreen.prototype.start = function() {
  this.engine.on('update', onUpdate.bind(this));
  this.engine.on('draw', onDraw.bind(this));
  this.engine.on('mousemove', onMouseMove.bind(this));
  this.engine.on('buttonup', onButtonUp.bind(this));
};

function onUpdate(dt, dx) {
}

function onDraw(context) {
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.fillStyle = "#000000";
  context.fillRect(0, 0, this.engine.size.x, this.engine.size.y);
  context.drawImage(this.levelCompleteImg, this.engine.size.x / 2 - this.levelCompleteImg.width / 2, 10);

  this.batch.draw(context);
}

function onMouseMove() {
}

function onButtonUp(button) {
}

LevelCompleteScreen.prototype.delete = function() {
  this.engine.removeAllListeners();
};

