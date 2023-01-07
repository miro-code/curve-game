const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  perMessageDeflate: false,
});
const path = require("path");
const GameServer = require("./GameServer.js").GameServer;
const PLAYER_COLORS = require("./GameServer.js").colors;

const SERVER_PORT = 3000;

const WIDTH_BOARD = 1000;
const HEIGHT_BOARD = 700;
const LOCATION_BOARD_X = 20;
const LOCATION_BOARD_Y = 20;
const INTER_FRAME_INTERVAL = 17;
const MAX_PLAYER = 4;

// const FRAME_RATE = 1 / INTER_FRAME_INTERVAL;

const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

let running_games = []; //Array containing all GameServers, index (slot) is server id and socket room
let empty_slots = [];
addNewGameServer(0);

let current_slot = 0; //server that starts next
io.on("connection", (socket) => handleConnection(socket));

/**
 * Callback method for handling a new connection
 *
 */
function handleConnection(socket) {
  socket.on("registration", (playerData) => {
    let player;
    const spaceship = getPlayerSpaceship(playerData.playerSpaceship);
    const name = getPlayerName(playerData.playerName);
    const color = getPlayerColor(playerData.playerColor);

    //Spieler tritt dem nächsten Server bei
    let server_id = current_slot;
    console.log("trying to add player to " + String(server_id));
    player = running_games[server_id].addPlayer(spaceship, color, name);

    socket.join(String(server_id));
    socket.emit("id", player.id);

    console.log(
      `A socket connected with id ${socket.id} and joined game ${server_id}`
    );

    //ist der Server nun voll, wird das Spiel gestartet
    if (running_games[server_id].isFull()) {
      current_slot = nextFreeSlot();
      addNewGameServer(current_slot);
      io.to(String(server_id)).emit("startCountdown");
      setTimeout(start, 5000, server_id);
      running_games[server_id].restarts++;
    }

    //ab jetzt erhält der Spieler regelmäßige updates vom Server dem er beigetreten ist
    const client_update_interval = setInterval(function () {
      const game_state = running_games[server_id].generateStatus();
      socket.emit("update", game_state);
      if (!player.alive && !player.death_message_sent) {
        socket.emit("death");
        player.death_message_sent = true;
      }
    }, INTER_FRAME_INTERVAL);

    //event listeners

    socket.on("manualStart", () => {
      running_games[server_id].manually_started = true;
      running_games[server_id].restarts++;
      io.to(String(server_id)).emit("startCountdown");
      setTimeout(start, 5000, server_id);

      current_slot = nextFreeSlot();
      addNewGameServer(current_slot);
    });

    socket.on("pressedKey", function (pressed_key) {
      if (pressed_key === "ArrowLeft" || pressed_key === "ArrowRight") {
        player.current_direction_pressed = pressed_key;
      } else {
        player.current_direction_pressed = "None";
      }
    });

    socket.on("startNewGame", (restarts) => {
      console.log("trying to start for the: " + String(restarts) + " time (= " + String(running_games[server_id].restarts))
      if(restarts == running_games[server_id].restarts){
        running_games[server_id].reset();
        io.to(String(server_id)).emit("startCountdown");
        setTimeout(start, 5000, server_id);
        running_games[server_id].restarts++;
      }
    });

    socket.on("disconnect", () => {
      player.connected = false;
      console.log("player disconnected");
      clearInterval(client_update_interval);
      if (running_games[server_id].isEmpty()) {
        emptySlot(server_id);
      }
    });
  });
}

/**
 * @returns {Int} Empty GameServer slot with lowest index
 */
function nextFreeSlot() {
  let next = empty_slots.pop();
  console.log("next is " + String(next));
  if (next === undefined) {
    console.log("set next current slot to " + String(running_games.length));
    return running_games.length;
  }
  console.log("set next current slot to " + String(next));
  return next;
}

/**
 * Kills a servers game loop and deletes it from the running_games list
 *
 * @param {Int} server_id index of Server without any active connections in running_games
 *
 */
function emptySlot(server_id) {
  console.log(`delete server ${server_id}`);
  clearInterval(running_games[server_id].game_loop_interval);
  

  running_games[server_id] = undefined;

  if (server_id == current_slot) {
    addNewGameServer(current_slot);
  } else {
    empty_slots.push(server_id);
    console.log("pushed " + String(server_id) + " to empty_slots");
  }

  
}

/**
 * Adds new GameServer to running_games using the default parameters
 *
 * @param {Int} position index in running_games
 *
 */
function addNewGameServer(position) {
  running_games[position] = new GameServer(
    LOCATION_BOARD_X,
    LOCATION_BOARD_Y,
    WIDTH_BOARD,
    HEIGHT_BOARD,
    INTER_FRAME_INTERVAL,
    MAX_PLAYER
  );

  console.log("server added to " + String(position));
}

/**
 * Starts the game loop
 *
 * @param {Int} server_id index of Server in running_games
 *
 */
function start(server_id) {
  // In case the server was abandoned before the countdown ended
  if (running_games[server_id] === undefined) {
    return;
  }

  io.to(String(server_id)).emit("start");
  running_games[server_id].running = true;

  let game_loop_interval = setInterval(function () {
    if(running_games[server_id] === undefined){
      clearInterval(game_loop_interval);
    }
    else if (running_games[server_id].running) {
      running_games[server_id].step();
    } else {
      clearInterval(running_games[server_id].game_loop_interval);
      gameFinished(server_id);
    }
  }, INTER_FRAME_INTERVAL);
  
  running_games[server_id].game_loop_interval = game_loop_interval;
}

/**
 * Sends winning message and stops the game loop
 *
 * @param {Int} server_id index of Server in running_games
 * @param {number} interval interval_id of the game loop
 *
 */
function gameFinished(server_id) {
  const winners = running_games[server_id].getWinners();
  if (winners.length === 1) {
    io.to(String(server_id)).emit("winner", winners[0].name);
  } else {
    io.to(String(server_id)).emit("tie");
  }
}

function getPlayerSpaceship(input) {
  if (
    input === "TinyTerri" ||
    input === "FatFrank" ||
    input === "AverageAnton"
  ) {
    return input;
  }
  return "AverageAnton";
}

function getPlayerName(input) {
  if (input) {
    return input;
  }
  return "Neuer Spieler";
}

function getPlayerColor(input) {
  const color = PLAYER_COLORS.findIndex((element) => element.name === input);
  if (color === -1) {
    return 0; // red
  }
  return color;
}

http.listen(SERVER_PORT, () => {
  console.log("Serving ${clientPath} on *:", SERVER_PORT);
});
