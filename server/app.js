const e = require("express");

const Express = require("express")();
const Http = require("http").Server(Express);
const SocketIo = require("socket.io")(Http);

const colors = {
  RED: 0,
  GREEN: 1,
  YELLOW: 2,
  BLUE: 3,
  WHITE: 4,
};
// Create empty playing field
var field = Array.from(Array(8), () => Array.from(Array(8), () => colors.WHITE));

// Set starting field (1 ball of each color in middle of the field)
field[3][3] = colors.RED;
field[3][4] = colors.GREEN;
field[4][3] = colors.YELLOW;
field[4][4] = colors.BLUE;

SocketIo.on("connection", (socket) => {
  socket.emit("field", field);
  socket.on("place", (data) => {
    // data has 3 properties: x, y and color;
    // First check if placement is valid
    // ( => check if the new ball is next to an already colored field & if the correct player played the move)
    // If this is not the case return error to the player who tried to place that 'ball'
    // Next place the ball and calculate the fields which need to change color
    // Color those fields and return the new field to every player
    var valid = checkIfValid(data.x, data.y);
    if (!valid) {
      socket.emit("test", "Faulty placement");
      return;
    }
    place(data.x, data.y, data.color);
    SocketIo.emit("field", field);
  });
});

Http.listen(3000, () => {
  console.log("Listening to :3000");
});

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
  if (filledIn(lowX,lowY)) return true;
  if (filledIn(lowX,y)) return true;
  if (filledIn(lowX,highY)) return true;
  if (filledIn(highX,lowY)) return true;
  if (filledIn(highX,y)) return true;
  if (filledIn(highX,highY)) return true;
  if (filledIn(x,highY)) return true;
  if (filledIn(x,lowY)) return true;
  return false;
}

function place(x, y, color) {

  // Horizontal checks
  field[x].forEach((tile, i) => {
    if (tile == color) {
      var lowerLimit = Math.min(i, y);
      var higherLimit = Math.max(i, y);
      
      if(field[x].slice(lowerLimit+1, higherLimit).some(pt => pt === colors.WHITE)){
        field[x][y] = color;
        return;
      }
      
      for (let index = lowerLimit; index < higherLimit; index++) {
        field[x][index] = color;
      }
    }
  });

  // Vertical checks
  var verticalLine = field.map(x => x[y]);
  verticalLine.forEach((tile, i) => {
    if (tile == color) {
      var lowerLimit = Math.min(i, x);
      var higherLimit = Math.max(i, x);
      
      if(verticalLine.slice(lowerLimit+1, higherLimit).some(pt => pt === colors.WHITE)){
        field[x][y] = color;
        return;
      }
      
      for (let index = lowerLimit; index < higherLimit; index++) {
        field[index][y] = color;
      }
    }
  });

  // Diagonal checks
  // LURD
  var lowestValue = Math.min(x,y);
  //var highedValue = Math.max(x,y);
  var lurdArray = [];
  var startingPoint = {x: x-lowestValue, y: y-lowestValue}
  lurdArray.push({x: startingPoint.x, y: startingPoint.y, color: field[startingPoint.x][startingPoint.y]});
  while(true){
    startingPoint.x ++;
    startingPoint.y ++;
    if(startingPoint.x == 8 || startingPoint.y ==8)
    break;
    lurdArray.push({x: startingPoint.x, y: startingPoint.y, color: field[startingPoint.x][startingPoint.y]});
  }
  lurdArray.sort((a,b) => {return a.x - b.x || a.y - b.y}).forEach((tile, i) => {
    if (tile.color == color) {
      var lowerLimit = Math.min(i, lurdArray.indexOf(lurdArray.find(o => o.x == x && o.y == y)));
      var higherLimit = Math.max(i, lurdArray.indexOf(lurdArray.find(o => o.x == x && o.y == y)));

      if(lurdArray.slice(lowerLimit+1, higherLimit).some(pt => pt === colors.WHITE)){
        field[x][y] = color;
        return;
      }

      for (let index = lowerLimit; index < higherLimit; index++) {
        field[lurdArray[index].x][lurdArray[index].y] = color;
      }
    }
  });

  // LDRU


  field[x][y] = color;
}

function filledIn(x, y) {
  if (field[x][y] != colors.WHITE) return true;
}
