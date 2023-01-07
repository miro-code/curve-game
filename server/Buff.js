/**
 * Function that is executed once the buff is collected
 *
 * @name BuffApply
 * @function
 * @param {GameServer} game_server GameServer Object which contains all players
 * @param {Integer} player_id Player that collected the buff
 */

/**
 * Function that is executed once the buff runs out
 *
 * @name BuffRevert
 * @function
 * @param {GameServer} game_server GameServer Object which contains all players
 * @param {Integer} player_id Player that collected the buff
 */

class Buff {
  /**
   * Create a Buff template
   *
   * @param {Integer} duration in frames
   * @param {BuffApply} apply
   * @param {BuffRevert} revert
   * @param {String} id
   *
   * @returns {Buff}
   */
  constructor(duration, apply, revert, id) {
    this.duration = duration;
    this.apply = apply;
    this.revert = revert;
    this.id = id;
  }

  return_status() {
    return { duration: this.duration, id: this.id };
  }

  tick() {
    this.duration--;
  }
}

/**
 * Size down Buff:
 * Decreases ones hitbox and sprite size by 50%
 */
const SIZE_DOWN_BUFF_DURATION = 700;
const ID_SIZE_DOWN_BUFF = "Size down";
const SIZE_DOWN_BUFF_SIZE_CHANGE = 0.5;
const SIZE_DOWN_BUFF_APPLY = function (game_server, player_id) {
  game_server.players.get(player_id).radius *= SIZE_DOWN_BUFF_SIZE_CHANGE;
};
const SIZE_DOWN_BUFF_REVERT = function (game_server, player_id) {
  game_server.players.get(player_id).radius /= SIZE_DOWN_BUFF_SIZE_CHANGE;
};
const SIZE_DOWN_BUFF = new Buff(
  SIZE_DOWN_BUFF_DURATION,
  SIZE_DOWN_BUFF_APPLY,
  SIZE_DOWN_BUFF_REVERT,
  ID_SIZE_DOWN_BUFF
);

/**
 * Others Handling Down:
 * Reduces the handling value of other players by 25%
 */
const OTHERS_HANDLING_DOWN_BUFF_DURATION = 500;
const ID_OTHERS_HANDLING_DOWN_BUFF = "Handling down for others";
const OTHERS_HANDLING_DOWN_BUFF_HANDLING_CHANGE = 0.75;
const OTHERS_HANDLING_DOWN_BUFF_APPLY = function (game_server, player_id) {
  for (const [id, player] of game_server.players) {
    if (id != player_id) {
      player.handling *= OTHERS_HANDLING_DOWN_BUFF_HANDLING_CHANGE;
    }
  }
};
const OTHERS_HANDLING_DOWN_BUFF_REVERT = function (game_server, player_id) {
  for (const [id, player] of game_server.players) {
    if (id != player_id) {
      player.handling /= OTHERS_HANDLING_DOWN_BUFF_HANDLING_CHANGE;
    }
  }
};
const OTHERS_HANDLING_DOWN_BUFF = new Buff(
  OTHERS_HANDLING_DOWN_BUFF_DURATION,
  OTHERS_HANDLING_DOWN_BUFF_APPLY,
  OTHERS_HANDLING_DOWN_BUFF_REVERT,
  ID_OTHERS_HANDLING_DOWN_BUFF
);

/**
 * Adrenalin Buff:
 * Speeds up all other players
 * by 35% (handling + speed), and the player
 * by 20% speed + 15% handling
 * */

const ADRENALIN_BUFF_DURATION = 700;
const ID_SLOMO_BUFF = "Time Speed Up";
const ADRENALIN_BUFF_PLAYER_SPEED_SLOW = 1.2;
const ADRENALIN_BUFF_PLAYER_HANDLING_SLOW = 1.15;
const ADRENALIN_BUFF_OTHERS_SPEED_SLOW = 1.35;
const ADRENALIN_BUFF_OTHERS_HANDLING_SLOW = 1.35;
const ADRENALIN_BUFF_APPLY = function (game_server, player_id) {
  for (const [id, player] of game_server.players) {
    if (id === player_id) {
      player.speed *= ADRENALIN_BUFF_PLAYER_SPEED_SLOW;
      player.handling *= ADRENALIN_BUFF_PLAYER_HANDLING_SLOW;
    } else {
      player.speed *= ADRENALIN_BUFF_OTHERS_SPEED_SLOW;
      player.handling *= ADRENALIN_BUFF_OTHERS_HANDLING_SLOW;
    }
  }
};
const ADRENALIN_BUFF_REVERT = function (game_server, player_id) {
  for (const [id, player] of game_server.players) {
    if (id === player_id) {
      player.speed /= ADRENALIN_BUFF_PLAYER_SPEED_SLOW;
      player.handling /= ADRENALIN_BUFF_PLAYER_HANDLING_SLOW;
    } else {
      player.speed /= ADRENALIN_BUFF_OTHERS_SPEED_SLOW;
      player.handling /= ADRENALIN_BUFF_OTHERS_HANDLING_SLOW;
    }
  }
};
const ADRENALIN_BUFF = new Buff(
  ADRENALIN_BUFF_DURATION,
  ADRENALIN_BUFF_APPLY,
  ADRENALIN_BUFF_REVERT,
  ID_SLOMO_BUFF
);

/**
 * Handling Buff:
 * increases handling of the player by 40%
 *  */

const HANDLING_BUFF_DURATION = 1000;
const ID_HANDLING_BUFF = "Handling UP";
const HANDLING_BUFF_HANDLING_CHANGE = 1.4;
const HANDLING_BUFF_APPLY = function (game_server, player_id) {
  game_server.players.get(player_id).handling *= HANDLING_BUFF_HANDLING_CHANGE;
};
const HANDLING_BUFF_REVERT = function (game_server, player_id) {
  game_server.players.get(player_id).handling /= HANDLING_BUFF_HANDLING_CHANGE;
};
const HANDLING_BUFF = new Buff(
  HANDLING_BUFF_DURATION,
  HANDLING_BUFF_APPLY,
  HANDLING_BUFF_REVERT,
  ID_HANDLING_BUFF
);

/**
 * Invincibility Buff:
 * Player is invincible to Barricade collisions
 * @TODO write something neat and cool for board collision
 *  */

const INVINCIBILITY_BUFF_DURATION = 1000;
const ID_INVINCIBILITY_BUFF = "Structure Invincibility";
const INVINCIBILITY_BUFF_APPLY = function (game_server, player_id) {
  game_server.players.get(player_id).ignore_barricades = true;
};
const INVINCIBILITY_BUFF_REVERT = function (game_server, player_id) {
  game_server.players.get(player_id).ignore_barricades = false;
};
const INVINCIBILITY_BUFF = new Buff(
  INVINCIBILITY_BUFF_DURATION,
  INVINCIBILITY_BUFF_APPLY,
  INVINCIBILITY_BUFF_REVERT,
  ID_INVINCIBILITY_BUFF
);

/**
 * Speed Buff:
 * Increases player speed by 30%
 * and handling by 50%
 */

const SPEED_BUFF_DURATION = 1000;
const SPEED_BUFF_SPEED_CHANGE = 1.3;
const SPEED_BUFF_HANDLING_CHANGE = 1.5;
const ID_SPEED_BUFF = "Speed UP";
const SPEED_BUFF_APPLY = function (game_server, player_id) {
  game_server.players.get(player_id).speed *= SPEED_BUFF_SPEED_CHANGE;
  game_server.players.get(player_id).handling *= SPEED_BUFF_HANDLING_CHANGE;
};
const SPEED_BUFF_REVERT = function (game_server, player_id) {
  game_server.players.get(player_id).speed /= SPEED_BUFF_SPEED_CHANGE;
  game_server.players.get(player_id).handling /= SPEED_BUFF_HANDLING_CHANGE;
};
const SPEED_BUFF = new Buff(
  SPEED_BUFF_DURATION,
  SPEED_BUFF_APPLY,
  SPEED_BUFF_REVERT,
  ID_SPEED_BUFF
);

/**
 * Barricade Width Buff:
 * Increases Barricade width by 50 %
 */
const BARRICADE_WIDTH_BUFF_DURATION = 1120;
const BARRICADE_WIDTH_BUFF_CHANGE = 1.5;
const ID_BARRICADE_WIDTH_BUFF = "Barricade width UP";
const BARRICADE_WIDTH_BUFF_APPLY = function (game_server, player_id) {
  let player = game_server.players.get(player_id);
  player.createBarricadeGap();
  player.barricade_width *= BARRICADE_WIDTH_BUFF_CHANGE;
};
const BARRICADE_WIDTH_BUFF_REVERT = function (game_server, player_id) {
  let player = game_server.players.get(player_id);
  player.createBarricadeGap();
  player.barricade_width /= BARRICADE_WIDTH_BUFF_CHANGE;
};
const BARRICADE_WIDTH_BUFF = new Buff(
  BARRICADE_WIDTH_BUFF_DURATION,
  BARRICADE_WIDTH_BUFF_APPLY,
  BARRICADE_WIDTH_BUFF_REVERT,
  ID_BARRICADE_WIDTH_BUFF
);

const BUFFS = [
  SPEED_BUFF,
  BARRICADE_WIDTH_BUFF,
  INVINCIBILITY_BUFF,
  HANDLING_BUFF,
  ADRENALIN_BUFF,
  SIZE_DOWN_BUFF,
  OTHERS_HANDLING_DOWN_BUFF,
];

module.exports = { buff_templates: BUFFS, buff_class: Buff };
