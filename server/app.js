const { Socket } = require("net");

const Express = require("express")();
const Http = require("http").Server(Express);
const SocketIo = require("socket.io")(Http);
var port = process.env.PORT || 3000;

const colors = {
  RED: 0,
  GREEN: 1,
  YELLOW: 2,
  BLUE: 3,
  WHITE: 4,
};

// Create empty playing field
var field;
// Player array, uses indices from the colors array to set player to certain color;
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
      players[data.color] = data.name;
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
    emitGameState();

  });
  socket.on("reset", (data) => {
    if (data === "reset") initializeGame();
    emitGameState();
  });
});

Http.listen(process.env.port, () => {
  var addr = Http.address();
  console.log('app listening on http://' + addr.address + ':' + addr.port);
});

function checkIfPlayerIsAllowedToPlay(color) {
  console.log(`playedColor: ${color}, currentTurnColor: ${currentTurn}`);
  if (color != currentTurn) return false;
  return true;
}

function checkIfValid(posX, posY) {
  var valid = field.some((x) =>
    x.some(
      (y) =>
        field.indexOf(x) >= posX - 1 &&
        field.indexOf(x) <= posX + 1 &&
        x.indexOf(y) >= posY - 1 &&
        x.indexOf(y) <= posY + 1 &&
        y != null &&
        !filledIn(posX, posY)
    )
  );
  //return valid;
  // UGLY AF needs to change to something with Some function as tried above
  // but i'm to keep it as backup
  x = posX;
  y = posY;
  lowX = x == 0 ? 0 : x - 1;
  lowY = y == 0 ? 0 : y - 1;
  highX = x == 7 ? 7 : x + 1;
  highY = y == 7 ? 7 : y + 1;
  if (filledIn(posX, posY)) return false;
  if (filledIn(lowX, lowY)) return true;
  if (filledIn(lowX, y)) return true;
  if (filledIn(lowX, highY)) return true;
  if (filledIn(highX, lowY)) return true;
  if (filledIn(highX, y)) return true;
  if (filledIn(highX, highY)) return true;
  if (filledIn(x, highY)) return true;
  if (filledIn(x, lowY)) return true;
  return false;
}

function place(x, y, color) {
  checkHorizontalLines(x, y, color);
  checkVerticalLines(x, y, color);
  checkLeftUpRightDownDiagonal(x, y, color);
  checkLeftDownRightUpDiagonal(x, y, color);
  field[x][y] = color;
}

function filledIn(x, y) {
  if (field[x][y] != colors.WHITE) return true;
}

function checkHorizontalLines(x, y, color) {
  // Horizontal checks
  field[x].forEach((tile, i) => {
    if (tile == color) {
      var lowerLimit = Math.min(i, y);
      var higherLimit = Math.max(i, y);

      if (
        field[x]
          .slice(lowerLimit + 1, higherLimit)
          .some((pt) => pt === colors.WHITE)
      ) {
        field[x][y] = color;
        return;
      }

      for (let index = lowerLimit; index < higherLimit; index++) {
        field[x][index] = color;
      }
    }
  });
}

function checkVerticalLines(x, y, color) {
  // Vertical checks
  var verticalLine = field.map((x) => x[y]);
  verticalLine.forEach((tile, i) => {
    if (tile == color) {
      var lowerLimit = Math.min(i, x);
      var higherLimit = Math.max(i, x);

      if (
        verticalLine
          .slice(lowerLimit + 1, higherLimit)
          .some((pt) => pt === colors.WHITE)
      ) {
        field[x][y] = color;
        return;
      }

      for (let index = lowerLimit; index < higherLimit; index++) {
        field[index][y] = color;
      }
    }
  });
}

function checkLeftUpRightDownDiagonal(x, y, color) {
  var lowestValue = Math.min(x, y);
  var lurdArray = [];
  var startingPoint = { x: x - lowestValue, y: y - lowestValue };
  lurdArray.push({
    x: startingPoint.x,
    y: startingPoint.y,
    color: field[startingPoint.x][startingPoint.y],
  });
  while (true) {
    startingPoint.x++;
    startingPoint.y++;
    if (startingPoint.x == 8 || startingPoint.y == 8) break;
    lurdArray.push({
      x: startingPoint.x,
      y: startingPoint.y,
      color: field[startingPoint.x][startingPoint.y],
    });
  }
  lurdArray
    .sort((a, b) => {
      return a.x - b.x || a.y - b.y;
    })
    .forEach((tile, i) => {
      if (tile.color == color) {
        var lowerLimit = Math.min(
          i,
          lurdArray.indexOf(lurdArray.find((o) => o.x == x && o.y == y))
        );
        var higherLimit = Math.max(
          i,
          lurdArray.indexOf(lurdArray.find((o) => o.x == x && o.y == y))
        );
        if (
          lurdArray
            .slice(lowerLimit + 1, higherLimit)
            .some((pt) => pt.color === colors.WHITE)
        ) {
          field[x][y] = color;
          return;
        }

        for (let index = lowerLimit; index < higherLimit; index++) {
          field[lurdArray[index].x][lurdArray[index].y] = color;
        }
      }
    });
}

function checkLeftDownRightUpDiagonal(x, y, color) {
  var ldruArray = [];
  var theoreticalStartPoint = x + y;
  var actualStartingPoint;
  actualStartingPoint =
    theoreticalStartPoint > 7
      ? { x: 7, y: theoreticalStartPoint - 7 }
      : { x: theoreticalStartPoint, y: 0 };
  ldruArray.push({
    x: actualStartingPoint.x,
    y: actualStartingPoint.y,
    color: field[actualStartingPoint.x][actualStartingPoint.y],
  });
  while (true) {
    actualStartingPoint.x--;
    actualStartingPoint.y++;
    if (actualStartingPoint.x < 0 || actualStartingPoint.y > 7) break;
    ldruArray.push({
      x: actualStartingPoint.x,
      y: actualStartingPoint.y,
      color: field[actualStartingPoint.x][actualStartingPoint.y],
    });
  }
  ldruArray.forEach((tile, i) => {
    if (tile.color == color) {
      var lowerLimit = Math.min(
        i,
        ldruArray.indexOf(ldruArray.find((o) => o.x == x && o.y == y))
      );
      var higherLimit = Math.max(
        i,
        ldruArray.indexOf(ldruArray.find((o) => o.x == x && o.y == y))
      );

      if (
        ldruArray
          .slice(lowerLimit + 1, higherLimit)
          .some((pt) => pt.color === colors.WHITE)
      ) {
        field[x][y] = color;
        return;
      }

      for (let index = lowerLimit; index < higherLimit; index++) {
        field[ldruArray[index].x][ldruArray[index].y] = color;
      }
    }
  });
}

function initializeGame() {
  field = Array.from(Array(8), () => Array.from(Array(8), () => colors.WHITE));
  // Set starting field (1 ball of each color in middle of the field)
  field[3][3] = colors.RED;
  field[3][4] = colors.GREEN;
  field[4][3] = colors.YELLOW;
  field[4][4] = colors.BLUE;
  players = [null, null, null, null];
  currentTurn = Math.floor(Math.random() * 4);
}

function emitGameState() {
  SocketIo.emit("field", field);
  SocketIo.emit("players", players);
  SocketIo.emit("currentPlayer", currentTurn);
}

function nextTurn() {
  if (currentTurn == 3) currentTurn = 0;
  else currentTurn++;

  if (players[currentTurn] == null) nextTurn();
}
