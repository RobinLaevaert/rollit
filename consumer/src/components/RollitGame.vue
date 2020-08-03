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
          v-bind:class="[
            { currentPlayer: index == currentTurn },
            { chosenPlayer: player.name || color },
            { unchosen: !color && !player.name },
          ]"
          :disabled="player.name || color"
          v-on:click="chooseColor(index)"
        >
          <p v-if="player">{{ player.name }}</p>
        </button>
      </li>
    </ul>
    <div class="spelBord">
      <ul>
        <li v-for="(tile, index) in coordField" v-bind:key="index">
          <button
            class="button playButton"
            v-bind:style="{ 'background-color': determineColor(tile.color) }"
            v-on:click="click(tile)"
            style="color:pink"
          >
            <!--X:{{tile.x}} <br> Y:{{tile.y}}-->
          </button>
        </li>
      </ul>
    </div>
    <div>
      <h2>Scoreboard:</h2>
      <ol>
        <li
          v-for="(player, index) in players
            .filter((x) => x.name != null)
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
      coordField: [],
      players: [],
      playerName: "",
      currentTurn: 0,
      colors,
      color: null,
    };
  },
  created() {
    this.socket = io("localhost:3000");
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
    this.socket.on("test", (data) => console.log(data)); // Temp, should show some error when this happens => faulty move. tag of socket needs to change aswell.
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
        case 5:
          returnValue = "black";
          break;
        case null:
          returnValue = "white";
          break;
      }
      return returnValue;
    },
    click(tile) {
      this.socket.emit("place", { x: tile.x, y: tile.y });
    },
    chooseColor(color) {
      let playerName = prompt("What is your username?");
      if (playerName) {
        this.playerName = playerName;
        this.color = color;
        this.socket.emit("chooseColor", {
          color: color,
          name: this.playerName,
        });
      }
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
}
.currentPlayer {
  -webkit-box-shadow: 0px 0px 56px 19px rgba(17, 255, 0, 1);
  -moz-box-shadow: 0px 0px 56px 19px rgba(17, 255, 0, 1);
  box-shadow: 0px 0px 56px 19px rgba(17, 255, 0, 1);
}
.normal {
  border: 1px solid black;
}
.unchosen {
  cursor: pointer;
}
.unchosen:hover {
  border: 3px solid orangered;
}
.chosenPlayer {
  cursor: auto;
}
</style>
