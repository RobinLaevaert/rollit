<template>
  <div>
    <button v-on:click="reset()">Reset</button>
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
    this.socket = io("localhost:3000");
  },
  mounted() {
    this.socket.on("test", (data) => console.log(data));
  },
  methods: {
      reset(){
          this.socket.emit("reset", "reset");
      }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
