//depend "chem"
//depend "ship"
var Chem = window.Chem
  , v = Chem.Vec2d
  , SS = window.SS
  , Ship = SS.Ship

Chem.onReady(function () {
  var canvas = document.getElementById("game");
  var engine = new Chem.Engine(canvas);
  var physicsObjects = {};
  var batch = new Chem.Batch();
  var boom = new Chem.Sound('sfx/boom.ogg');
  var ship = new Ship();
  batch.add(ship.sprite);
  physicsObjects[ship.id] = ship;
  engine.setSize(v(1067, 600));
  engine.on('update', function (dt, dx) {
    for (var id in physicsObjects) {
      var obj = physicsObjects[id];
      obj.update(dt, dx);
    }

    // rotate the ship with left and right arrow keys
    ship.rotateInput = 0;
    if (engine.buttonState(Chem.Button.Key_Left)) ship.rotateInput -= 1;
    if (engine.buttonState(Chem.Button.Key_Right)) ship.rotateInput += 1;

    // apply forward and backward thrust with up and down arrow keys
    ship.thrustInput = 0;
    if (engine.buttonState(Chem.Button.Key_Up)) ship.thrustInput += 1;
    if (engine.buttonState(Chem.Button.Key_Down)) ship.thrustInput -= 1;
  });
  engine.on('draw', function (context) {
    // clear canvas to black
    context.fillStyle = '#000000'
    context.fillRect(0, 0, engine.size.x, engine.size.y);

    // draw all sprites in batch
    engine.draw(batch);

    // draw a little fps counter in the corner
    context.fillStyle = '#ffffff'
    engine.drawFps();
  });
  engine.start();
  canvas.focus();
});
