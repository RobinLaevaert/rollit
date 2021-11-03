<template>
  <div>
    <button v-on:click="reset()">RESET</button>
    <button v-on:click="start()">START</button>
  </div>
</template>

<script>
import io from "socket.io-client";

export default {
  name: "ResetComponent",
  data() {
    return {
      socket: {},
    };
  },
  created() {
    this.socket = io("https://rolit.herokuapp.com");
  },
  mounted() {
    this.socket.on("test", (data) => console.log(data));
  },
  methods: {
    reset() {
      this.socket.emit("reset", "reset");
    },
    start() {
      this.socket.emit("start");
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
