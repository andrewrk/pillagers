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
    ship_flag_still: {
      frames: ["ship/flag0.png"],
    },
    ship_flag_decel: {
      loop: false,
      frames: [
        "ship/flag2.png",
        "ship/flag1.png",
        "ship/flag0.png",
      ],
    },
    ship_flag_accel: {
      loop: false,
      frames: [
        "ship/flag0.png",
        "ship/flag1.png",
        "ship/flag2.png",
      ],
    },
    ship_flag_accel_back: {
      loop: false,
      frames: [
        "ship/flag0.png",
        "ship/flag3.png",
        "ship/flag4.png",
        "ship/flag5.png",
      ],
    },
    ship_flag_decel_back: {
      loop: false,
      frames: [
        "ship/flag5.png",
        "ship/flag4.png",
        "ship/flag3.png",
        "ship/flag0.png",
      ],
    },
    ship_turret_still: {
      frames: ["ship/turret0.png"],
    },
    ship_turret_accel: {
      loop: false,
      frames: [
        "ship/turret0.png",
        "ship/turret1.png",
        "ship/turret2.png",
        "ship/turret3.png",
      ],
    },
    ship_turret_decel: {
      loop: false,
      frames: [
        "ship/turret3.png",
        "ship/turret2.png",
        "ship/turret1.png",
        "ship/turret0.png",
      ],
    },
    explosion: {
      loop: false,
    },
    disintegrate: {
      loop: false,
      frames: 'fx/disintegrate',
    },
    'fx/electric': {
      anchor: 'bottom',
      loop: false,
    },
    'bullet/circle': {},
    'bullet/small': {},
    'bullet/large': {},
    'flag': {
      anchor: 'bottomleft',
    },
    'knife': {},

    'star/small': {},
    'star/large': {},
    'planet-red': {},

  }
};
