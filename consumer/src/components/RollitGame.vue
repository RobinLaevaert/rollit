<template>
  <div>
    <p>Players:</p>
    <ul>
      <li
        v-for="(player, index) in players"
        v-bind:key="`player-${index}`"
        class="players"
      >
        <button
          class="button players"
          v-bind:style="{ 'background-color': determineColor(index) }"
          v-bind:class="[{ currentPlayer: index == currentTurn }]"
          disabled
        >
          <p v-if="player">{{ player.name }}</p>
        </button>
      </li>
    </ul>
    <input v-model="playerName" placeholder="Player name" />
    <p>
      <button v-on:click="changeColor(colors.RED)">Red</button>
      <button v-on:click="changeColor(colors.GREEN)">Green</button>
      <button v-on:click="changeColor(colors.YELLOW)">Yellow</button>
      <button v-on:click="changeColor(colors.BLUE)">Blue</button>
    </p>
    <div class="spelBord">
      <ul>
          <li
            v-for="(tile, index) in coordField"
            v-bind:key="index"
          >
            <button
              class="button playButton"
              v-bind:style="{ 'background-color': determineColor(tile.color) }"
              v-on:click="click(tile)"
              style="color:black"
            >X:{{tile.x}} <br> Y:{{tile.y}}</button>
          </li>
      </ul>
    </div>
    <div>
      <h2>Scoreboard:</h2>
      <ol>
        <li
          v-for="(player, index) in players
            .filter((x) => x)
            .sort((a, b) => b.score - a.score)"
          v-bind:key="`scoreBoardPlayer-${index}`"
        >
          <h3>{{ player.name }} - {{ player.score }}</h3>
        </li>
      </ol>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
const colors = {
  RED: 0,
  GREEN: 1,
  YELLOW: 2,
  BLUE: 3,
};
export default {
  name: "RollitGame",
  data() {
    return {
      socket: {},
      context: {},
      field: {},
      coordField: [],
      players: [],
      playerName: "",
      currentTurn: 0,
      colors,
      color: colors.RED,
      colorString: "RED",
    };
  },
  created() {
    this.socket = io("http://localhost:3000");
  },
  mounted() {
    this.socket.on("field", (data) => {
      this.field = data;
    });
    this.socket.on("coordField", (data) => {
      this.coordField = data;
    });
    this.socket.on("players", (data) => {
      this.players = data;
    });
    this.socket.on("test", (data) => console.log(data));
    this.socket.on("yourColor", (data) => (this.color = data));
    this.socket.on("currentPlayer", (data) => (this.currentTurn = data));
  },
  methods: {
    changeColor(color) {
      this.socket.emit("chooseColor", { color: color, name: this.playerName });
    },
    determineColor(colorValue) {
      let returnValue;
      switch (colorValue) {
        case 0:
          returnValue = "red";
          break;
        case 1:
          returnValue = "green";
          break;
        case 2:
          returnValue = "yellow";
          break;
        case 3:
          returnValue = "blue";
          break;
        case null:
          returnValue = "white";
          break;
      }
      return returnValue;
    },
    click(tile) {
      console.log(`Tile clicked: {x:${tile.x}y:${tile.y}} Current color of this tile: ${this.determineColor(tile.color)}`);
      //this.socket.emit("place", { x: x, y: y, color: color });
      this.socket.emit("place", {x: tile.x, y: tile.y, color: this.color});
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.button {
  border: none;
  color: white;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border: 1px solid black;
}
.playButton:hover {
  border: 3px solid orangered;
}

ul {
  padding: 0;
  columns: 8;
  list-style-type: none;
}

.spelBord {
  width: 1000px;
  height: 896px;
  border: 1px solid black;
}
.players {
  display: inline-block;
  margin: 20px;
  color: black;
  font-weight: bold;
  cursor: auto;
}
.currentPlayer {
  -webkit-box-shadow: 0px 0px 56px 19px rgba(17, 255, 0, 1);
  -moz-box-shadow: 0px 0px 56px 19px rgba(17, 255, 0, 1);
  box-shadow: 0px 0px 56px 19px rgba(17, 255, 0, 1);
}
.normal {
  border: 1px solid black;
}
</style>
