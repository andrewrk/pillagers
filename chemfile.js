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
    'rock-a': {},
    'rock-b': {},
    'rock-c': {},
    portal: {
      frames: [
        "portal/01.png",
        "portal/02.png",
        "portal/03.png",
        "portal/04.png",
        "portal/05.png",
        "portal/04.png",
        "portal/03.png",
        "portal/02.png",
      ]
    },
    'star/small': {},
    'star/large': {},
    'planet-red': {},
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
    ship_shield_still: {
      frames: ["ship/shield0.png"],
    },
    ship_shield_accel: {
      loop: false,
      frames: [
        "ship/shield1.png",
        "ship/shield2.png",
        "ship/shield3.png",
      ],
    },
    ship_shield_decel: {
      loop: false,
      frames: [
        "ship/shield2.png",
        "ship/shield1.png",
        "ship/shield0.png",
      ],
    },
    ship_shield_accel_back: {
      loop: false,
      frames: [
        "ship/shield4.png",
        "ship/shield5.png",
        "ship/shield6.png",
      ],
    },
    ship_shield_decel_back: {
      loop: false,
      frames: [
        "ship/shield5.png",
        "ship/shield4.png",
        "ship/shield0.png",
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
    ship_civilian_still: {
      frames: [ "ship/civilian0.png"],
    },
    ship_civilian_accel: {
      loop: false,
      frames: [
        "ship/civilian0.png",
        "ship/civilian1.png",
        "ship/civilian2.png",
        "ship/civilian3.png",
      ],
    },
    ship_civilian_decel: {
      loop: false,
      frames: [
        "ship/civilian3.png",
        "ship/civilian2.png",
        "ship/civilian1.png",
        "ship/civilian0.png",
      ],
    },
    ship_artillery_still: {
      frames: [ "ship/artillery0.png"],
    },
    ship_artillery_accel: {
      loop: false,
      frames: [
        "ship/artillery0.png",
        "ship/artillery1.png",
        "ship/artillery2.png",
        "ship/artillery3.png",
      ],
    },
    ship_artillery_decel: {
      loop: false,
      frames: [
        "ship/artillery3.png",
        "ship/artillery2.png",
        "ship/artillery1.png",
        "ship/artillery0.png",
      ],
    },
    ship_cannon_still: {
      frames: ["ship/cannon0.png"],
    },
    ship_cannon_accel: {
      loop: false,
      frames: [
        "ship/cannon1.png",
        "ship/cannon2.png",
        "ship/cannon3.png",
        "ship/cannon4.png",
      ],
    },
    ship_cannon_decel: {
      loop: false,
      frames: [
        "ship/cannon3.png",
        "ship/cannon2.png",
        "ship/cannon1.png",
        "ship/cannon0.png",
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
    'bullet/small': {
      anchor: 'top',
    },
    'bullet/large': {
      anchor: 'top',
    },
    'bullet/cannonball': {},
    'flag': {
      anchor: 'bottomleft',
    },
    'knife': {},
    'shield': {},
    'coin': {},
    'target': {},
    'doorway': {},
  }
};
