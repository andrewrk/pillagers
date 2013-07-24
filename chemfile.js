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

    ship_ranger_still: {
      frames: ["ship/ranger0.png"],
    },
    ship_ranger_accel: {
      loop: false,
      frames: [
        "ship/ranger0.png",
        "ship/ranger1.png",
        "ship/ranger2.png",
        "ship/ranger3.png",
      ],
    },
    ship_ranger_decel: {
      loop: false,
      frames: [
        "ship/ranger3.png",
        "ship/ranger2.png",
        "ship/ranger1.png",
        "ship/ranger0.png",
      ],
    },
    explosion: {
      loop: false,
    },
    'bullet/circle': {},
    'bullet/small': {},
    'bullet/large': {},
    'fx/electric': {
      anchor: 'bottom',
    },
    'flag': {
      anchor: 'bottomleft',
    },

    'star/small': {},
    'star/large': {},
    'planet-red': {},

  }
};
