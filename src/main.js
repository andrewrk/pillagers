var chem = require('chem');
var v = chem.vec2d;
var Game = require('./game');
var canvas = document.getElementById("game");
var engine = new chem.Engine(canvas);
engine.setSize(v(1067, 600));
engine.showLoadProgressBar();
engine.start();
canvas.focus();
disableImageSmoothing(engine.context);
chem.resources.on('ready', function () {
  var game = new Game(engine);
  game.showTitleScreen();
});

function disableImageSmoothing(context) {
  engine.context.imageSmoothingEnabled = false;
  engine.context.webkitImageSmoothingEnabled = false;
  engine.context.mozImageSmoothingEnabled = false;
}
