const R = require("rambda");
const CircleObject = require("./CircleObject");

const BARRICADE_GAP_FRAME_AMOUNT = 100;
const BARRICADE_LENGTH_IN_FRAMES = 300;

function distance_squared(x1, y1, x2, y2) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

function saveLength(arr) {
  if (arr) {
    return arr.length;
  }
  return undefined;
}

function dropLastWhile(pred, arr) {
  const len = arr.length;
  let i = 0;
  if (len) {
    for (i; i < len; i++) {
      if (!pred(arr[len - 1 - i])) {
        break;
      }
    }
    return R.dropLast(i, arr);
  }
  return [];
}

const predicate_isColliding = R.curry(function (width, radius, p1, p2) {
  return (
    distance_squared(p1.x, p1.y, p2.x, p2.y) < (radius * 1.5 + width / 2) ** 2
  );
});

class Player extends CircleObject {
  /**
   * Creats a Player object :)
   *
   * @param {Integer} id
   * @param {Float} x
   * @param {Float} y
   * @param {Float} barricade_width
   * @param {Float} radius
   * @param {Float} inital_direction
   * @param {Float} inital_speed
   * @param {Float} inital_handling
   * @param {String} colors
   * @param {String} name
   * @param {String} type
   *
   * @returns {Player} Your very own player object ;)
   */
  constructor(
    id,
    x,
    y,
    barricade_width,
    radius,
    inital_direction,
    inital_speed,
    inital_handling,
    colors,
    name,
    type
  ) {
    super(x, y, radius);

    this.connected = true;

    this.name = name;

    // is the player still in the game
    this.alive = true;

    this.death_message_sent = false;

    // current player buffs
    this.buffs = [];

    // type of the spaceship our hero drives
    this.type = type;

    // take a guess
    this.score = 0;

    this.color = colors.color;
    this.color_name = colors.name;

    // Integer id
    this.id = id;

    // width of barricade
    this.barricade_width = barricade_width;

    // direction in radians; speed in pixels; handling (amount of change in direction) in radians
    this.direction = inital_direction;
    this.speed = inital_speed;
    this.handling = inital_handling;

    // a barricade is a list of points
    // barricade are all already closed barricades
    // current_barricade contains the points of the current not closed barricade
    this.current_barricade = [this.newBarricadePoint()];
    this.barricade = [];

    this.current_direction_pressed = undefined;

    // tells if currently a barricade should be created
    this.barricade_gap = -100;
    this.barricade_length_in_frames = BARRICADE_LENGTH_IN_FRAMES;

    // for invincibility buff
    this.ignore_barricades = false;
  }

  /**
   * checks if a gap in the barricade should be drawn
   */
  handleGap() {
    this.barricade_length_in_frames--;
    if (this.barricade_length_in_frames === 0) {
      this.createBarricadeGap();
    }
  }

  /**
   * resets the barricade length counter. Used when starting to
   * draw a new barricade
   */
  setBarricadeLengthCounter() {
    this.barricade_length_in_frames = BARRICADE_LENGTH_IN_FRAMES;
  }

  /**
   * movement of the player for one frame
   */
  move() {
    let delta_x = Math.cos(this.direction) * this.speed;
    let delta_y = Math.sin(this.direction) * this.speed;
    this.x += delta_x;
    this.y += delta_y;
    return [delta_x, delta_y];
  }

  /**
   * Gets the point 180° from the player direction which is 1.5 * player radius
   * away from the player
   */
  getEdgePoint() {
    let dx =
      -1.5 *
      Math.cos(this.direction) *
      (this.radius + this.barricade_width / 2);
    let dy =
      -1.5 *
      Math.sin(this.direction) *
      (this.radius + this.barricade_width / 2);
    return { x: this.x + dx, y: this.y + dy };
  }

  /**
   * Closes current barricade
   */
  closeCurrentBarricade() {
    this.current_barricade.push({ x: this.x, y: this.y });
    this.barricade.push({
      width: this.barricade_width,
      barricade: this.current_barricade,
    });
    this.current_barricade = [];
    this.setBarricadeLengthCounter();
  }

  createBarricadeGap() {
    this.closeCurrentBarricade();
    this.barricade_gap = BARRICADE_GAP_FRAME_AMOUNT;
  }

  /**
   * changes direction of player movement based on userinput and
   * handling value
   *
   * @param {Float} direction Userinput
   */
  changeDirection(direction) {
    switch (direction) {
      case "ArrowRight":
        if (this.barricade_gap < 0) {
          this.current_barricade.push(this.newBarricadePoint());
        }
        this.direction += this.handling;
        break;
      case "ArrowLeft":
        if (this.barricade_gap < 0) {
          this.current_barricade.push(this.newBarricadePoint());
        }
        this.direction -= this.handling;
        break;
      default:
    }
  }

  /**
   * Applies a buff to the player
   *
   * @param {GameServer} game_server
   * @param {Buff} buff
   */
  applyBuff(game_server, buff) {
    this.buffs.push(buff);
    buff.apply(game_server, this.id);
  }

  /**
   * creates a new Barricade point. If it stays this simple there is
   * no need for this function
   */
  newBarricadePoint() {
    //   let dx =
    //     -Math.cos(this.direction) * (this.radius + this.barricade_width / 2);
    //   let dy =
    //     -Math.sin(this.direction) * (this.radius + this.barricade_width / 2);
    return { x: this.x, y: this.y };
  }

  /**
   * Ticks down the duration of all the buffs
   * the player has and calls their revert function
   * if they ran out
   *
   * @param {GameServer} game_server
   */
  tickBuffs(game_server) {
    let active_buffs = [];
    for (let i = 0; i < this.buffs.length; i++) {
      let current_buff = this.buffs[i];
      current_buff.tick();
      if (current_buff.duration) {
        active_buffs.push(current_buff);
      } else {
        current_buff.revert(game_server, this.id);
      }
    }
    this.buffs = active_buffs;
  }

  reduceByVicinityRight(barricade_ref, barricade_width) {
    let len = barricade_ref.length;
    for (let i = 0; i < len; i++) {
      let point = barricade_ref[len - i - 1];
      if (
        distance_squared(point.x, point.y, this.x, this.y) >
        (this.radius * 1.5 + barricade_width / 2) ** 2
      ) {
        return len - i;
      }
    }
    return 0;
  }

  logState(note) {
    if (this.type == "02") {
      let len2, len3;
      try {
        len2 = saveLength(this.barricade[0].barricade);
      } catch (e) {
        len2 = undefined;
      }

      try {
        len3 = saveLength(this.barricade[1].barricade);
      } catch (e) {
        len3 = undefined;
      }
      console.log(
        note,
        saveLength(this.current_barricade),
        len2,
        len3,
        this.current_direction_pressed
      );
    }
  }

  /**
   * complicated to explain in words. Is used to calculate the
   * barricade which is used for collision detection for this
   * and other players
   */
  getCurrentBarricadesForCollisionDetection() {
    const radius = this.radius;
    let barricade_width = this.barricade_width;
    const player_position = { x: this.x, y: this.y };
    const predicate_isColliding1 = predicate_isColliding(
      barricade_width,
      radius,
      player_position
    );

    let last_barricade = {
      width: this.barricade_width,
      barricade: dropLastWhile(predicate_isColliding1, this.current_barricade),
    };
    if (!last_barricade.barricade.length) {
      if (!this.barricade.length) {
        return [];
      }
      const barricade_last = R.last(this.barricade);
      let barricade_tail = {
        barricade: dropLastWhile(
          predicate_isColliding1,
          barricade_last.barricade
        ),
        width: barricade_last.width,
      };
      if (!barricade_tail.barricade.length) {
        return [];
      }
      if (this.barricade_gap < -30) {
        barricade_tail.barricade.push(this.getEdgePoint());
      }
      return R.init(this.barricade).concat(barricade_tail);
    }
    if (this.barricade_gap < -30) {
      last_barricade.barricade.push(this.getEdgePoint());
    }
    return this.barricade.concat(last_barricade);
  }

  /**
   * currently not needed. Might be needed when there are more complicated
   * player actions just as "Shoot Missile" or "Use Special Spacecraft Ability"
   * */
  executeActions(actions) {}

  reset(x, y, radius, barricade_width, direction, speed, handling) {
    this.alive = true;
    this.death_message_sent = false;
    this.buffs = [];
    this.score = 0;

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.barricade_width = barricade_width;
    this.direction = direction;
    this.speed = speed;
    this.handling = handling;

    this.current_barricade = [this.newBarricadePoint()];
    this.barricade = [];
    this.current_direction_pressed = undefined;
    this.barricade_gap = -100;
    this.barricade_length_in_frames = BARRICADE_LENGTH_IN_FRAMES;
    this.ignore_barricades = false;
  }
}

module.exports = Player;
