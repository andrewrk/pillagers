var chem = require('chem');
var v = chem.vec2d;

module.exports = CreditsScreen;

function CreditsScreen(game) {
  this.game = game;
  this.engine = game.engine;
  this.bg = chem.resources.images['credits-screen.png'];
  this.batch = new chem.Batch();
  this.scroll = v(100, 500);
  initText(this);
}

function backToTitleScreen(self) {
  self.delete();
  self.game.showTitleScreen();
}

function initText(self) {
  var lines = chem.resources.text['credits.txt'].split("\n");
  var pos = v(0, 0);
  var lineHeight = 30;
  lines.forEach(function(line) {
    if (line.trim().length === 0) {
      pos.y += lineHeight;
      return;
    }
    var label = new chem.Label(line, {
      pos: pos.clone(),
      fillStyle: "#ffffff",
      font: "24px monospace",
      batch: self.batch,
      textAlign: 'left',
      textBaseline: 'top',
    });
    pos.y += lineHeight;
  });
}

CreditsScreen.prototype.start = function() {
  this.initDate = new Date();
  this.engine.on('update', onUpdate.bind(this));
  this.engine.on('draw', onDraw.bind(this));
  this.engine.on('buttonup', onButtonUp.bind(this));
};

function onDraw(context) {
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.drawImage(this.bg, 0, 0);

  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.translate(this.scroll.x, this.scroll.y);
  this.batch.draw(context);
}

function onMouseMove() {
  var pt = this.engine.mousePos;
  for (var i = 0; i < this.options.length; i += 1) {
    var option = this.options[i];
    var hit = pt.y > option.label.pos.y - 30 && pt.y < option.label.pos.y + 30;
    option.label.stroke = hit;
  }
}

function onButtonUp(button) {
  if (new Date() - this.initDate > 1000) backToTitleScreen(this);
}

function onUpdate(dt, dx) {
  this.scroll.y -= dx * 1;
}

CreditsScreen.prototype.delete = function() {
  this.engine.removeAllListeners();
};

