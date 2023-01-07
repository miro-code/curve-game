const CircleObject = require("./CircleObject");

const EXPIRATION_TIME = 30 * 1000;
const BOX_RADIUS = 10;

function random_choice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

class Box extends CircleObject {
  /**
   * Create a circular Buff Box
   *
   * @param {Float} x
   * @param {Float} y
   * @param {Buff} buff
   *
   * @returns {Box}
   */
  constructor(x, y) {
    super(x, y, BOX_RADIUS);
    this.expire = EXPIRATION_TIME; // in frames
    this.sprite = 1 + random_choice([...Array(18).keys()]);
  }

  addBuff(buff) {
    this.buff = buff;
  }

  /**
   * returns the BoxStatusObject which then can be
   * transmitted to the clients
   *
   * @returns {BoxStatusObject}
   */
  return_status() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius /** , type: this.buff.id*/,
      sprite: this.sprite,
    };
  }
}

Box.prototype.radius = BOX_RADIUS

module.exports = Box;
