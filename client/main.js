import { GameClient } from "./GameClient.js";

class Client {
  constructor() {
    this.game_client = new GameClient();
    this.socket = io();
    this.inter_frame_interval = 17;
    this.join_button = document.getElementById("joinButton");
    this.start_button = document.getElementById("startButton");
    this.name_input_field = document.getElementById("playerName");
    this.restart_button = document.getElementById("restartButton");
    this.countdown = document.getElementById("countdown");
    this.restarts = 0;
    this.pressed_key = "None";
    this.countdown_interval;

    document.addEventListener("keydown", this.handleKeyDownEvent.bind(this));

    document.addEventListener("keyup", this.handleKeyUpEvent.bind(this));

    this.join_button.addEventListener("click", this.registration.bind(this));

    this.start_button.addEventListener("click", this.start.bind(this));

    this.restart_button.addEventListener("click", this.startNewGame.bind(this));

    this.name_input_field.addEventListener(
      "input",
      this.handleNameInput.bind(this)
    );

    setInterval(() => {
      this.socket.emit("pressedKey", this.pressed_key);
    }, this.inter_frame_interval);

    this.socket.on("connect", () => {
      this.game_client.draw();
    });

    this.socket.on("startCountdown", () => {
      this.restarts++;
      this.hideElement("waitingOverlay");
      this.hideElement("graphEnd");
      this.showGame();
      this.showElement("countdownOverlay");
      let counter = 5;
      this.countdown.innerHTML = counter;
      this.countdown_interval = setInterval(() => {
        counter--;
        this.countdown.innerHTML = counter;
      }, 1000);
    });

    this.socket.on("start", () => {
      clearInterval(this.countdown_interval);
      this.hideElement("countdownOverlay");
    });

    this.socket.on("id", (id) => {
      this.game_client.id = id;
    });

    this.socket.on("update", (game_state) => {
      // buffs: [{duration : 50, id : "Handling up"}, ... ]
      if (this.getNumberOfPlayers(game_state) > 1) {
        this.enableButton(this.start_button);
      }
      this.getBuffs(game_state.players);
      this.barsInScoreboard(game_state.players);
      this.endScoresBars(game_state.players);

      this.game_client.drawGame(game_state);
    });

    this.socket.on("death", () => {
      this.showElement("deathOverlay");
    });

    this.socket.on("winner", (winner) => {
      document.getElementById("winnerName").innerHTML = winner;
      this.hideGame();
      this.showElement("graphEnd");
    });

    this.socket.on("tie", () => {
      this.hideGame();
      this.hideElement("winner");
      this.showElement("tie");
      this.showElement("graphEnd");
    });
  }

  handleKeyDownEvent(event) {
    if (
      (event.code === "ArrowLeft" && this.pressed_key !== "ArrowRight") ||
      (event.code === "ArrowRight" && this.pressed_key !== "ArrowLeft")
    ) {
      this.pressed_key = event.code;
    }
  }

  handleKeyUpEvent(event) {
    if (event.code === this.pressed_key) {
      this.pressed_key = "None";
    }
  }

  registration() {
    this.join_button.removeEventListener("click", this.registration.bind(this));
    const name = this.getPlayerName();
    const spaceship = this.getInputFromRadioElement("spaceship");
    const color = this.getInputFromRadioElement("color");
    this.socket.emit("registration", {
      playerName: name,
      playerSpaceship: spaceship,
      playerColor: color,
    });
    this.hideElement("intro");
    this.showGame();
    this.showElement("waitingOverlay");
  }

  start() {
    this.socket.emit("manualStart");
  }

  handleNameInput() {
    if (this.name_input_field.value) {
      this.enableButton(this.join_button);
    } else {
      this.disableButton(this.join_button);
    }
  }

  hideElement(id) {
    document.getElementById(id).style.display = "none";
  }

  showElement(id) {
    document.getElementById(id).style.display = "block";
  }

  hideGame() {
    this.hideElement("deathOverlay");
    this.hideElement("graph");
    this.hideElement("canvas");
  }

  showGame() {
    this.showElement("graph");
    this.showElement("canvas");
  }

  enableButton(button) {
    button.disabled = false;
  }

  disableButton(button) {
    button.disabled = true;
  }

  getPlayerName() {
    return this.name_input_field.value;
  }

  getInputFromRadioElement(element_name) {
    const options = document.getElementsByName(element_name);
    let selected_element = "";
    for (let i = 0; i < options.length; i++) {
      if (options[i].checked) {
        selected_element = options[i].value;
      }
    }
    return selected_element;
  }

  getNumberOfPlayers(game_state) {
    return game_state.players.length;
  }

  startNewGame() {
    this.socket.emit("startNewGame", this.restarts);
  }

  getBuffs(data) {
    var html = [];
    for (let i = 0; i < data.length; i++) {
      let curr_buffs = data[i].buffs;
      let template =
        "<br>" +
        data[i].player_name +
        "<br>" +
        "----------------------------" +
        "<br>";
      for (let j = 0; j < curr_buffs.length; j++) {
        template =
          template + curr_buffs[j].id + " : " + curr_buffs[j].duration + "<br>";
      }
      html.push(template);
      document.getElementById("buffsData").innerHTML = html.join("");
    }
  }

  barsInScoreboard(data) {
    var html = [];
    for (let i = 0; i < data.length; i++) {
      let template =
        "<p id = 'name'>" +
        data[i].player_name +
        " (" +
        data[i].score +
        ")" +
        "</p>" +
        "<div class='progress-bar2' style='width: " +
        data[i].score / 70 +
        "%" +
        "; background: " +
        data[i].color +
        "'>" +
        "</div>";

      html.push(template);
      document.getElementById("barsInScoreboard").innerHTML = html.join("");
    }
  }
  endScoresBars(data) {
    var html = [];
    for (let i = 0; i < data.length; i++) {
      let template =
        "<p id = 'nameEnd'>" +
        data[i].player_name +
        "</p>" +
        "<div class='progress-bar' style='width: " +
        data[i].score / 70 +
        "%" +
        "; background: " +
        data[i].color +
        "'>" +
        "<div class='progress-value'>" +
        data[i].score +
        "</div>" +
        "</div>";

      html.push(template);
      document.getElementById("endScoresBars").innerHTML = html.join("");
    }
  }
}

const CLIENT = new Client();
