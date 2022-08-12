import { createSlice } from "@reduxjs/toolkit";

export const mapSlice = createSlice({
  name: "map",
  initialState: {
    width: 60,
    height: 40,
    size: 15,
    tile_states: [...Array(40)].map((e) =>
      Array(60)
        .fill()
        .map((u) => ({
          room: 0,
          on: false,
          color: "black",
        }))
    ),
    textures: {},
  },

  reducers: {
    setWidth: (state, action) => {
      state.width = action.payload;
      //   state.tile_states = [
      //     ...Array(state.height).map((e) =>
      //       Array(state.width)
      //         .fill()
      //         .map((u) => ({
      //           room: 0,
      //           on: false,
      //         }))
      //     ),
      //   ];
    },

    setHeight: (state, action) => {
      state.height = action.payload;
      //   state.tile_states = [
      //     ...Array(state.height).map((e) =>
      //       Array(state.width)
      //         .fill()
      //         .map((u) => ({
      //           room: 0,
      //           on: false,
      //         }))
      //     ),
      //   ];
    },

    setSize: (state, action) => {
      state.size = action.payload;
    },

    setTileCondition: (state, action) => {
      const { tile_x, tile_y, condition } = action.payload;
      const tile_state_copy = state.tile_states.map((r) => [...r]);
      tile_state_copy[tile_y][tile_x] = condition;
      state.tile_states = tile_state_copy;
    },

    setTilesCondition: (state, action) => {
      state.tile_states = action.payload;
      state.height = state.tile_states.length;
      state.width = state.tile_states[0].length;
    },

    setTexture: (state, action) => {
      //   state.textures = { ...state.textures, tile_background: action.payload };
      state.textures = { tile_background: action.payload };
    },
  },
});

export const {
  setWidth,
  setHeight,
  setSize,
  setTileCondition,
  setTilesCondition,
  setTexture,
} = mapSlice.actions;

export default mapSlice.reducer;
