# CURVE GAME

## What is Curve Game?

Curve Game, in a nutshell, is a four player multiplayer game, where you steer a spaceship, build colored walls and win by crashing your enemies into said strucutres. All in all it is a game template that has a vast possibility for features, and thusly can be improved without end.

## How is it implemented and how do you run it?

The general structure of our implementation is a server which handles the logic of the game and then broadcasts a status to each client where the game then will be rendered. To start the game one has to execute Server.js via node.js, which will start the game server on port 3000, ready for connection via HTTP. Alternatively, one can open a command prompt in the game directory and type `npm start`. Naturally, you need to have [NodeJS](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/) installed.

![Have fun](pictures/Curverfever_Titelpage1.PNG?raw=true)