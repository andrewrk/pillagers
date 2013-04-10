//depend "chem"
var Chem = window.Chem
  , v = Chem.Vec2d

Chem.onReady(function () {
  var canvas = document.getElementById("game");
  var engine = new Chem.Engine(canvas);
  var batch = new Chem.Batch();
  var boom = new Chem.Sound('sfx/boom.ogg');
  var ship = new Chem.Sprite('ship', {
    batch: batch,
    pos: v(200, 200),
    rotation: Math.PI / 2
  });
  var ship_vel = v();
  var rotation_speed = Math.PI * 0.04;
  var thrust_amt = 0.1;
  engine.setSize(v(1067, 600));
  engine.on('update', function (dt, dx) {
    ship.pos.add(ship_vel);

    // rotate the ship with left and right arrow keys
    if (engine.buttonState(Chem.Button.Key_Left)) {
        ship.rotation -= rotation_speed * dx;
    }
    if (engine.buttonState(Chem.Button.Key_Right)) {
        ship.rotation += rotation_speed * dx;
    }

    // apply forward and backward thrust with up and down arrow keys
    var thrust = v(Math.cos(ship.rotation - Math.PI / 2), Math.sin(ship.rotation - Math.PI / 2));
    if (engine.buttonState(Chem.Button.Key_Up)) {
      ship_vel.add(thrust.scaled(thrust_amt * dx));
    }
    if (engine.buttonState(Chem.Button.Key_Down)) {
      ship_vel.sub(thrust.scaled(thrust_amt * dx));
    }

    // press space to blow yourself up
    if (engine.buttonJustPressed(Chem.Button.Key_Space)) {
      boom.play();
      ship.setAnimationName('boom');
      ship.setFrameIndex(0);
      ship.on('animation_end', function() {
        ship.delete();
      });
    }
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
