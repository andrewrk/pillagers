// the main source file which depends on the rest of your source files.
exports.main = 'src/main';

var v = require("chem").vec2d;
exports.spritesheet = {
  defaults: {
    delay: 0.05,
    loop: true,
    // possible values: a Vec2d instance, or one of:
    // ["center", "topleft", "topright", "bottomleft", "bottomright",
    //  "top", "right", "bottom", "left"]
    anchor: "center"
  },
  animations: {
    explosion: {
      loop: false,
    },
    ship_militia_still: {
      frames: ["ship/militia0.png"],
    },
    ship_militia_accel: {
      loop: false,
      frames: [
        "ship/militia0.png",
        "ship/militia1.png",
        "ship/militia2.png",
        "ship/militia3.png",
      ],
    },
    ship_militia_decel: {
      loop: false,
      frames: [
        "ship/militia3.png",
        "ship/militia2.png",
        "ship/militia1.png",
        "ship/militia0.png",
      ],
    },
    'bullet/circle': {},
    'bullet/small': {},
    'bullet/large': {}
  }
};
