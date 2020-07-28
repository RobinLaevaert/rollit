<template>
  <div>
    <p>Current color: {{ colorString }}</p>
    <p>
      <button v-on:click="changeColor(colors.RED)">Red</button>
      <button v-on:click="changeColor(colors.GREEN)">Green</button>
      <button v-on:click="changeColor(colors.YELLOW)">Yellow</button>
      <button v-on:click="changeColor(colors.BLUE)">Blue</button>
    </p>
    <div class="spelBord">
      <ul>
        <ul v-for="(row,index) in field" v-bind:key="`rows-${index}`" class="rowUl">
          <li
            v-for="(rowElement, index) in row"
            v-bind:key="field.indexOf(row) + ` ` + index"
          >
            <button
              class="button"
              v-bind:style="{ 'background-color': determineColor(rowElement) }"
              v-on:click="
                click(field.indexOf(row), index, color)
              "
            ></button>
          </li>
        </ul>
      </ul>
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
      colors,
      color: colors.RED,
      colorString: "RED"
    };
  },
  created() {
    this.socket = io("http://localhost:3000");
  },
  mounted() {
    this.socket.on("field", (data) => {
      this.field = data;
    });
    this.socket.on("test", (data) => console.log(data));
  },
  methods: {
    changeColor(color) {
      this.color = color;
      switch (color) {
        case 0:
          this.colorString = "Red";
          break;
        case 1:
          this.colorString = "Green";
          break;
        case 2:
          this.colorString = "Yellow";
          break;
        case 3:
          this.colorString = "Blue";
          break;
      }
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
    click(x, y, color) {
      console.log(x, y, color);
      this.socket.emit("place", { x: x, y: y, color: color });
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
.button:hover {
  border: 3px solid orangered;
}

ul {
  padding: 0;
}
.rowUl {
  columns: 8;
  list-style-type: none;
}
.spelBord {
  width: 1000px;
  height: 896px;
  border: 1px solid black;
}
</style>
