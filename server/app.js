const Express = require("express");
const Http = require("http");
var app = Express();
var server = Http.createServer(app);
const SocketIo = require("socket.io").listen(server);

app.set("port", 3000);
server.listen(3000, () => {
  var addr = server.address();
  console.log("app listening on http://" + addr.address + ":" + addr.port);
});

const colors = {
  RED: 0,
  GREEN: 1,
  YELLOW: 2,
  BLUE: 3,
  WHITE: 4,
};

// Create empty playing field
var coordField;
// Player array, uses indices from the colors array to set player to certain color;
// Is an array of objects containing name and score.
var players;
var currentTurn;

initializeGame();

SocketIo.on("connection", (socket) => {
  emitGameState();
  socket.on("chooseColor", (data) => {
    if (players[data.color] != null)
      socket.emit("colorAlreadyChosen", players[data.color]);
    else if (players.some((x) => x === data.name))
      socket.emit("colorAlreadyChosen", players[data.color]);
    else {
      players[data.color] = { name: data.name, score: 1 };
      socket.emit("yourColor", data.color);
      emitGameState();
    }
  });
  socket.on("place", (data) => {
    // data has 3 properties: x, y and color;
    // First check if placement is valid
    // ( => check if the new ball is next to an already colored field & if the correct player played the move)
    // If this is not the case return error to the player who tried to place that 'ball'
    // Next place the ball and calculate the fields which need to change color
    // Color those fields and return the new field to every player
    var allowedToPlay = checkIfPlayerIsAllowedToPlay(data.color);
    if (!allowedToPlay) {
      socket.emit("test", "Not your turn");
      return;
    }
    var valid = checkIfValid(data.x, data.y);
    if (!valid) {
      socket.emit("test", "Faulty placement");
      return;
    }
    place(data.x, data.y, data.color);
    nextTurn();
    calculateScores();
    emitGameState();
  });
  socket.on("reset", (data) => {
    if (data === "reset") initializeGame();
    emitGameState();
  });
});

function checkIfPlayerIsAllowedToPlay(color) {
  console.log(`playedColor: ${color}, currentTurnColor: ${currentTurn}`);
  if (color != currentTurn) return false;
  return true;
}

function checkIfValid(posX, posY) {
  var placedTile = coordField.find(
    (tile) => tile.x === posX && tile.y === posY
  );
  var valid = coordField.some(
    (tile) =>
      posX - 1 <= tile.x &&
      tile.x <= posX + 1 &&
      posY - 1 <= tile.y &&
      tile.y <= posY + 1 &&
      tile.color != colors.WHITE
  );
  return placedTile.color === colors.WHITE && valid;
}

function place(x, y, color) {
  var tilesToTakeOver = [
    ...checkHorizontalLines(x, y, color),
    ...checkVerticalLines(x, y, color),
    ...checkLeftUpRightDownDiagonal(x, y, color),
    ...checkLeftDownRightUpDiagonal(x, y, color),
  ];
  var distinctTilesToTakeOver = tilesToTakeOver.filter(
    (thing, i, arr) =>
      arr.findIndex((t) => t.x === thing.x && t.y === thing.y) === i
  );
  distinctTilesToTakeOver.forEach((tile) => setColor(tile.x, tile.y, color));
  setColor(x, y, color)
}

function checkHorizontalLines(x, y, color) {
  var tilesToTakeOver = [];
  var horizontalLine = coordField.filter((tile) => tile.y === y);
  horizontalLine.forEach((tile) => {
    if (tile.color == color) {
      var lowerLimit = Math.min(x, tile.x);
      var upperLimit = Math.max(x, tile.x);
      var slicedHorizontalLine = horizontalLine.filter(
        (tile) => lowerLimit < tile.x && tile.x < upperLimit
      );

      if (
        slicedHorizontalLine.every(
          (tile) => tile.color != colors.WHITE && tile.color != color
        )
      ) {
        tilesToTakeOver = [
          ...tilesToTakeOver,
          ...slicedHorizontalLine.map((tile) => {
            return { x: tile.x, y: tile.y };
          }),
        ];
      }
    }
  });
  return tilesToTakeOver;
}

function checkVerticalLines(x, y, color) {
  var verticalLine = coordField.filter((tile) => tile.x === x);
  var tilesToTakeOverVertically = [];
  verticalLine.forEach((tile) => {
    if (tile.color == color) {
      var lowerLimit = Math.min(y, tile.y);
      var upperLimit = Math.max(y, tile.y);
      var slicedVerticalLine = verticalLine.filter(
        (tile) => lowerLimit < tile.y && tile.y < upperLimit
      );

      if (slicedVerticalLine.every((tile) => tile.color != colors.WHITE)) {
        tilesToTakeOverVertically = [
          ...tilesToTakeOverVertically,
          ...slicedVerticalLine
            .filter((x) => x.color != color)
            .map((tile) => {
              return { x: tile.x, y: tile.y };
            }),
        ];
      }
    }
  });
  return tilesToTakeOverVertically;
}

function checkLeftUpRightDownDiagonal(x, y, color) {
  var tilesToTakeOver = [];
  var diagonalLine = coordField.filter((tile) => tile.x - tile.y === x - y);
  diagonalLine.forEach((tile) => {
    if (tile.color == color) {
      var lowerLimit = Math.min(x, tile.x);
      var upperLimit = Math.max(x, tile.x);
      var slicedDiagonalLine = diagonalLine.filter(
        (tile) => lowerLimit < tile.x && tile.x < upperLimit
      );

      if (
        slicedDiagonalLine.every(
          (tile) => tile.color != colors.WHITE && tile.color != color
        )
      ) {
        tilesToTakeOver = [
          ...tilesToTakeOver,
          ...slicedDiagonalLine.map((tile) => {
            return { x: tile.x, y: tile.y };
          }),
        ];
      }
    }
  });
  return tilesToTakeOver;
}

function checkLeftDownRightUpDiagonal(x, y, color) {
  var tilesToTakeOver = [];
  var diagonalLine = coordField.filter((tile) => tile.x + tile.y === x + y);
  diagonalLine.forEach((tile) => {
    if (tile.color == color) {
      var lowerLimit = Math.min(x, tile.x);
      var upperLimit = Math.max(x, tile.x);
      var slicedDiagonalLine = diagonalLine.filter(
        (tile) => lowerLimit < tile.x && tile.x < upperLimit
      );

      if (
        slicedDiagonalLine.every(
          (tile) => tile.color != colors.WHITE && tile.color != color
        )
      ) {
        tilesToTakeOver = [
          ...tilesToTakeOver,
          ...slicedDiagonalLine.map((tile) => {
            return { x: tile.x, y: tile.y };
          }),
        ];
      }
    }
  });
  return tilesToTakeOver;
}

function initializeGame() {
  coordField = [...Array(64).keys()]
    .map((x) => {
      return { x: x % 8, y: Math.floor(x / 8), color: colors.WHITE };
    })
    .sort((a, b) => a.x - b.x);
  // Set starting field (1 ball of each color in middle of the field)
  setColor(3, 3, colors.RED);
  setColor(3, 4, colors.YELLOW);
  setColor(4, 3, colors.GREEN);
  setColor(4, 4, colors.BLUE);
  setColor(3, 0, colors.RED);
  setColor(3, 1, colors.GREEN);
  setColor(3, 2, colors.BLUE);

  players = [null, null, null, null];
  currentTurn = 0;
}

function emitGameState() {
  SocketIo.emit("coordField", coordField);
  SocketIo.emit("players", players);
  SocketIo.emit("currentPlayer", currentTurn);
}

function calculateScores() {
  // for (let index = 0; index < players.length; index++) {
  //   if (players[index])
  //     players[index] = {...players[index], score: coordField.filter((x) => x.color === index).length};
  // }
  console.log(players);
  players = players.map((player, index) => {return {...player, score: coordField.filter((x) => x.color === index).length}});
  console.log(players);
}

function nextTurn() {
  if (currentTurn == 3) currentTurn = 0;
  else currentTurn++;

  if (players[currentTurn] == null) nextTurn();
}

function setColor(x, y, color) {
  coordField.find((tile) => tile.x == x && tile.y == y).color = color;
}
