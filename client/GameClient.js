// Main canvas & context
const CANVAS = document.getElementById("canvas");
const CONTEXT = CANVAS.getContext("2d");

// canvas & context to create the Player View
const GAME_CANVAS = document.createElement("canvas");
GAME_CANVAS.width = window.innerWidth;
GAME_CANVAS.height = window.innerHeight;
const GAME_CONTEXT = GAME_CANVAS.getContext("2d");

CANVAS.width = window.innerWidth;
CANVAS.height = window.innerHeight;

const BOARD_BORDER_COLOR = "#f5f5f5";

const BORDER_WIDTH_BOARD = 2;
const WIDTH_BOARD = 1000;
const HEIGHT_BOARD = 700;
const LOCATION_BOARD_X = 10;
const LOCATION_BOARD_Y = 10;

const PLAYER_WINDOW_WIDTH = 800;
const PLAYER_WINDOW_HEIGHT = (PLAYER_WINDOW_WIDTH * HEIGHT_BOARD) / WIDTH_BOARD;

/**
 * @typedef {PlayerStatusObject} PlayerStatusObject
 * @property {Integer} id
 * @property {Float} x
 * @property {Float} y
 * @property {Float} radius
 * @property {String} color
 * @property {BarricadeObject} barricade_object
 * @property {Float} directiona
 * @property {BoxStatusObject} buffs
 * @property {String} player_name
 * @property {String} spaceship_type
 */

/**
 * @typedef {BoxStatusObject} BoxStatusObject
 * @property {Float} x
 * @property {Float} y
 * @property {Float} radius
 * @property {Integer} sprite
 */

export class GameClient {
  constructor() {
    this.player = [];
    this.barricade = [];
    this.box = [];
    this.assets = {
      background: "images/background.png",
      spaceship01: "images/spaceship01.png",
      spaceship02: "images/spaceship02.png",
      spaceship03: "images/spaceship03.png",
      box: "images/box.png",
    };
    for (let i = 1; i < 19; i++) {
      this.assets["box" + i.toString()] =
        "images/box (" + i.toString() + ").png";
    }
    this.loadAssets();
  }

  loadAssets() {
    var count = 0;
    var length = Object.keys(this.assets).length;
    for (var k in this.assets) {
      var image = new Image();
      image.src = this.assets[k];
      this.assets[k] = image;
      image.onload = function () {
        count++;
        if (count == length) {
          return;
        }
      };
    }
  }

  drawGame(game_state) {
    this.draw();
    this.clearWindowGame();
    this.drawWindowBoard();
    for (let i = 0; i < game_state.players.length; i++) {
      this.drawPlayer(game_state.players[i]);
    }
    for (let i = 0; i < game_state.boxes.length; i++) {
      this.drawBox(game_state.boxes[i]);
    }
    if (this.id) {
      for (let i = 0; i < game_state.players.length; i++) {
        if (game_state.players[i].id === this.id) {
          this.drawPlayerView(
            game_state.players[i].x,
            game_state.players[i].y,
            PLAYER_WINDOW_WIDTH,
            PLAYER_WINDOW_HEIGHT
          );
          break;
        }
      }
    }
  }

  draw() {
    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
    this.drawBackGround();
  }

  drawBackGround() {
    CONTEXT.setTransform(1, 0, 0, 1, 0, 0);
    CONTEXT.drawImage(
      this.assets.background,
      10,
      10,
      CONTEXT.canvas.width,
      CONTEXT.canvas.height
    );
  }

  /**
   * draws border of the board
   *
   * @param {CanvasRenderingContext2D} context
   */
  drawBoard(context) {
    let temp = { fs: context.strokeStyle, lw: context.lineWidth };
    context.lineWidth = BORDER_WIDTH_BOARD;
    context.strokeStyle = BOARD_BORDER_COLOR;
    context.strokeRect(
      LOCATION_BOARD_X + 10,
      LOCATION_BOARD_Y + 10,
      WIDTH_BOARD,
      HEIGHT_BOARD
    );
    context.strokeStyle = temp.fs;
    context.lineWidth = temp.lw;
  }

  /**
   * Clears the canvas on which we draw the Player View
   */
  clearWindowGame() {
    GAME_CONTEXT.clearRect(0, 0, GAME_CANVAS.width, GAME_CANVAS.height);
  }

  /**
   * Draws the border for the Player View
   */
  drawWindowBoard() {
    this.drawBoard(GAME_CONTEXT);
  }

  /**
   * Draws a player and their barricade onto a
   * temporary canvas
   *
   * @param {PlayerStatusObject} player
   */
  drawPlayer(player) {
    GAME_CONTEXT.font = "14px Verdana";
    GAME_CONTEXT.fillStyle = player.color;
    GAME_CONTEXT.fillText(
      player.player_name,
      player.x - 2 * player.radius - 22,
      player.y - 2 * player.radius - 15
    );

    // draw Barricade, straight forward
    let barricade = player.barricade_object;
    GAME_CONTEXT.strokeStyle = player.color;
    GAME_CONTEXT.fillStyle = player.color;
    for (
      let barricade_index = 0;
      barricade_index < barricade.length;
      barricade_index++
    ) {
      let current_barricade_obj = barricade[barricade_index];
      let current_barricade = current_barricade_obj.barricade;
      let first = current_barricade[0];
      if (first) {
        let last = current_barricade[current_barricade.length - 1];
        let prev_width = GAME_CONTEXT.lineWidth;

        GAME_CONTEXT.lineWidth = current_barricade_obj.width;
        GAME_CONTEXT.beginPath();
        GAME_CONTEXT.moveTo(first.x, first.y);
        for (let i = 1; i < current_barricade.length; i++) {
          GAME_CONTEXT.lineTo(current_barricade[i].x, current_barricade[i].y);
        }
        GAME_CONTEXT.stroke();
        GAME_CONTEXT.lineWidth = prev_width;

        this.drawCircle(last.x, last.y, current_barricade_obj.width / 2);
        this.drawCircle(first.x, first.y, current_barricade_obj.width / 2);
      }
    }

    /* drawPlayer 
    needs to be played after drawing the barricades so they player 
    overshadows the barricades, and I am too lazy to write it differently right now, i.e. 
    draw the barricade only behind the player
    */
    let id = "spaceship" + player.spaceship_type;
    let asset = this.assets[id];
    this.drawRotatedImage(
      asset,
      player.direction,
      player.radius * 4,
      player.radius * 4,
      player.x - player.radius * 2,
      player.y - player.radius * 2
    );
  }

  /**
   * Take a guess
   *
   * @param {Float} x
   * @param {Float} y
   * @param {Float} radius
   */
  drawCircle(x, y, radius) {
    GAME_CONTEXT.lineWidth = 0.1;
    GAME_CONTEXT.beginPath();
    GAME_CONTEXT.arc(x, y, radius, 0, Math.PI * 2);
    GAME_CONTEXT.fill();
  }

  /**
   * Draws the Buff Box on a temporary canvas
   *
   * @param {BoxStatusObject} box
   */
  drawBox(box) {
    GAME_CONTEXT.drawImage(
      this.assets["box" + box.sprite.toString()],
      box.x - 35 / 2,
      box.y - 35 / 2,
      35,
      35
    );
  }

  /**
   * Rotates an Image and then draws it
   *
   * @param {CanvasRenderingContext2D.Image} image Image Object to rotate and draw
   * @param {Float} radians angle to rotate it by
   * @param {Float} image_width width the image should have
   * @param {Float} image_height height the image should have
   * @param {Float} image_x x coordinate of the image
   * @param {Float} image_y y coordinate of the image
   */
  drawRotatedImage(
    image,
    radians,
    image_width,
    image_height,
    image_x,
    image_y
  ) {
    GAME_CONTEXT.setTransform(
      Math.cos(radians),
      Math.sin(radians),
      -Math.sin(radians),
      Math.cos(radians),
      image_x + image_width / 2,
      image_y + image_height / 2
    );
    GAME_CONTEXT.drawImage(
      image,
      -image_width / 2,
      -image_height / 2,
      image_width,
      image_height
    );
    GAME_CONTEXT.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Draws the view of the player onto the main canvas Object
   *
   * @param {Float} x x player coordinate
   * @param {Float} y y player coordinate
   * @param {Float} width width of the player window
   * @param {Float} height height of the player window
   */
  drawPlayerView(x, y, width, height) {
    CONTEXT.drawImage(
      GAME_CANVAS,
      x - width / 2,
      y - height / 2,
      width,
      height,
      LOCATION_BOARD_X,
      LOCATION_BOARD_Y,
      1000,
      700
    );
  }
}
