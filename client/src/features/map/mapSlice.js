import { createSlice } from "@reduxjs/toolkit";
import { generateTiles } from "./generationUtils";

export const mapSlice = createSlice({
  name: "map",
  initialState: {
    width: 60,
    height: 40,
    size: 15,
    nav_width: 350,
    map_data: { image: null, dd2vtt: null },
    tile_states: [...Array(40)].map((e) =>
      Array(60)
        .fill()
        .map((u) => ({
          room: 0,
          floor: false,
          color: "black",
          patternAsset: null,
        }))
    ),
    textures: {},
    loading: true,
  },

  reducers: {
    setWidth: (state, action) => {
      state.width = action.payload;
    },

    setSize: (state, action) => {
      state.size = action.payload;
    },

    setHeight: (state, action) => {
      state.height = action.payload;
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

    setTilesTexture: (state, action) => {
      let new_tile_states = [...Array(state.height)].map((e) =>
        Array(state.width)
      );
      const { texture, on_criteria, room_criteria } = action.payload;

      for (let j = 0; j < state.height; j++) {
        for (let i = 0; i < state.width; i++) {
          let tile = state.tile_states[j][i];
          if (
            (tile["floor"] === on_criteria || on_criteria == null) &&
            (tile["room"] === room_criteria || room_criteria == null)
          ) {
            new_tile_states[j][i] = { ...tile, patternImage: texture };
          } else {
            new_tile_states[j][i] = tile;
          }
        }
      }
      state.tile_states = new_tile_states;
    },

    setNavWidth: (state, action) => {
      state.nav_width = action.payload;
    },

    setMapData: (state, action) => {
      const { asset, href } = action.payload;
      state.map_data[asset] = href;
    },

    setTexture: (state, action) => {
      const { asset_name, imageURL, smallImgURL } = action.payload;
      state.textures[asset_name] = {
        imageURL: imageURL,
        smallImgURL: smallImgURL,
      };
    },

    setTextures: (state, action) => {
      let textures = action.payload;
      for (let i = 0; i < textures.length; i++) {
        let { asset_name, imageURL, smallImgURL } = textures[i];
        state.textures[asset_name] = {
          imageURL: imageURL,
          smallImgURL: smallImgURL,
        };
      }
    },
  },
});

export const {
  setWidth,
  setHeight,
  setSize,
  setTileCondition,
  setTilesCondition,
  setTilesTexture,
  setTexture,
  setTextures,
  setNavWidth,
  setMapData,
} = mapSlice.actions;

export default mapSlice.reducer;

// thunk functions

export const generateMap = (width, height, padding) => (dispatch, getState) => {
  const generatedTiles = generateTiles(width, height, padding);
  dispatch(setTilesCondition(generatedTiles));
};

function resizeImage(imageURL, size, asset_name) {
  return new Promise((resolve) => {
    let img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.height = size;
      canvas.width = size;
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0, size, size);
      let smallImg = new window.Image();
      smallImg.id = asset_name;
      smallImg.onload = () => {
        canvas.toBlob(function (blob) {
          resolve(URL.createObjectURL(blob));
        }, "image/png");
      };
      smallImg.src = canvas.toDataURL();
    };
    img.src = imageURL;
  });
}

export const addAsset =
  ({ asset_name, imageURL }) =>
  async (dispatch, getState) => {
    const state = getState();
    let size = state.map.size;
    let smallImgURL;
    try {
      smallImgURL = await resizeImage(imageURL, size, asset_name);
      dispatch(setTexture({ asset_name, imageURL, smallImgURL }));
    } catch (error) {
      console.log({ error });
    }
  };

export const setResolution = (size) => async (dispatch, getState) => {
  let state = getState();
  let textures = state.map.textures;
  let texture_assets = Object.keys(textures);

  try {
    let new_textures = [];
    for (let i = 0; i < texture_assets.length; i++) {
      let asset = texture_assets[i];
      let newSmallImgURL = await resizeImage(textures[asset]["imageURL"], size);
      new_textures.push({
        asset_name: asset,
        imageURL: textures[asset]["imageURL"],
        smallImgURL: newSmallImgURL,
      });
    }
    dispatch(setTextures(new_textures));
    dispatch(setSize(size));
  } catch (error) {
    console.log({ error });
  }
};

export const exportFiles =
  ({ stage, x_offset, y_offset }) =>
  (dispatch, getState) => {
    const state = getState();
    let { size, tile_states, width, height, nav_width } = state.map;

    const min_size = 100;

    // Initialzing object to create Universal VTT file
    const map_output = {};

    map_output["format"] = 0.2;
    map_output["resolution"] = {
      map_origin: {
        x: nav_width,
        y: 0,
      },
      map_size: {
        x: width,
        y: height,
      },
      pixels_per_grid: Math.max(size, min_size),
    };

    // Adding walls from tile boundaries
    let walls = [];
    for (let i = 0; i < width - 1; i++) {
      for (let j = 0; j < height - 1; j++) {
        // Checks for boudary on the right side of the tile and below the tile
        if (
          (tile_states[j][i]["floor"] || tile_states[j][i + 1]["floor"]) &&
          !(tile_states[j][i]["floor"] && tile_states[j][i + 1]["floor"])
        ) {
          walls.push([
            {
              x: i + 1,
              y: j,
            },
            {
              x: i + 1,
              y: j + 1,
            },
          ]);
        }
        if (
          (tile_states[j][i]["floor"] || tile_states[j + 1][i]["floor"]) &&
          !(tile_states[j][i]["floor"] && tile_states[j + 1][i]["floor"])
        ) {
          walls.push([
            {
              x: i,
              y: j + 1,
            },
            {
              x: i + 1,
              y: j + 1,
            },
          ]);
        }
      }
    }

    // Simplifying walls by joining when possible
    let reduced_walls = [];

    let vertical_walls = walls.filter((wall) => wall[0]["x"] === wall[1]["x"]);
    vertical_walls.sort((w1, w2) => {
      return (
        Math.max(w2[0]["y"], w2[1]["y"]) - Math.max(w1[0]["y"], w1[1]["y"])
      );
    });

    let horizontal_walls = walls.filter(
      (wall) => wall[0]["y"] === wall[1]["y"]
    );
    horizontal_walls.sort((w1, w2) => {
      return (
        Math.max(w2[0]["x"], w2[1]["x"]) - Math.max(w1[0]["x"], w1[1]["x"])
      );
    });

    // Simplifying vertical walls
    for (let i = 0; i < vertical_walls.length; i++) {
      if (vertical_walls[i]) {
        let wall = vertical_walls[i];
        for (let j = i + 1; j < vertical_walls.length; j++) {
          if (vertical_walls[j]) {
            let secondWall = vertical_walls[j];
            if (wall[0]["x"] === secondWall[0]["x"]) {
              if (
                wall[0]["y"] === secondWall[0]["y"] ||
                wall[0]["y"] === secondWall[1]["y"] ||
                wall[1]["y"] === secondWall[0]["y"] ||
                wall[1]["y"] === secondWall[1]["y"]
              ) {
                let y_coords = [
                  wall[0]["y"],
                  wall[1]["y"],
                  secondWall[0]["y"],
                  secondWall[1]["y"],
                ];
                wall[0]["y"] = Math.min(...y_coords);
                wall[1]["y"] = Math.max(...y_coords);
                vertical_walls[j] = null;
              }
            }
          }
        }
        reduced_walls.push(wall);
      }
    }

    // Simplifiying horizontal walls
    for (let i = 0; i < horizontal_walls.length; i++) {
      if (horizontal_walls[i]) {
        let wall = horizontal_walls[i];
        for (let j = i + 1; j < horizontal_walls.length; j++) {
          if (horizontal_walls[j]) {
            let secondWall = horizontal_walls[j];
            if (wall[0]["y"] === secondWall[0]["y"]) {
              if (
                wall[0]["x"] === secondWall[0]["x"] ||
                wall[0]["x"] === secondWall[1]["x"] ||
                wall[1]["x"] === secondWall[0]["x"] ||
                wall[1]["x"] === secondWall[1]["x"]
              ) {
                let x_coords = [
                  wall[0]["x"],
                  wall[1]["x"],
                  secondWall[0]["x"],
                  secondWall[1]["x"],
                ];
                wall[0]["x"] = Math.min(...x_coords);
                wall[1]["x"] = Math.max(...x_coords);
                horizontal_walls[j] = null;
              }
            }
          }
        }
        reduced_walls.push(wall);
      }
    }

    map_output["line_of_sight"] = reduced_walls;

    // Setting other attributes to defualt values for now
    map_output["portals"] = [];
    map_output["environment"] = {
      baked_lighting: true,
      ambient_light: "ffffffff",
    };
    map_output["lights"] = [];

    // Scaling image to meet minimum size for Universal VTT
    let scale = size < min_size ? min_size / size : 1;

    // Extracting image

    const url = stage.toDataURL({
      x: x_offset + nav_width,
      y: y_offset,
      width: width * size,
      height: height * size,
      pixelRatio: scale,
      imageSmoothingEnabled: false,
    });

    dispatch(setMapData({ asset: "image", href: url }));

    // Extracting just the encoding for VTT
    let image_str = url.split(",")[1];

    map_output["image"] = image_str;

    let blob = new Blob([JSON.stringify(map_output, null, 4)], {
      type: "text/plain",
    });

    let dd2vtt_href = window.URL.createObjectURL(blob);
    dispatch(setMapData({ asset: "dd2vtt", href: dd2vtt_href }));
  };
