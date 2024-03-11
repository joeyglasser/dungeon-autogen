import { createSlice } from "@reduxjs/toolkit";
import { generateTiles } from "./generationUtils";

export const mapSlice = createSlice({
  name: "map",
  initialState: {
    width: 30,
    height: 30,
    size: 10,
    navigationWidth: 350,
    mapData: { image: null, dd2vtt: null },
    // room
    tileStates: [...Array(40)].map((e) =>
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
      const { tileX, tileY, condition } = action.payload;
      const tile_state_copy = state.tileStates.map((r) => [...r]);
      tile_state_copy[tileY][tileX] = condition;
      state.tileStates = tile_state_copy;
    },

    setTilesCondition: (state, action) => {
      state.tileStates = action.payload;
      state.height = state.tileStates.length;
      state.width = state.tileStates[0].length;
    },

    setTilesTexture: (state, action) => {
      let newTileStates = [...Array(state.height)].map((e) =>
        Array(state.width)
      );
      const { texture, onCritieria, roomCriteria } = action.payload;

      for (let j = 0; j < state.height; j++) {
        for (let i = 0; i < state.width; i++) {
          let tile = state.tileStates[j][i];
          if (
            (tile["floor"] === onCritieria || onCritieria == null) &&
            (tile["room"] === roomCriteria || roomCriteria == null)
          ) {
            newTileStates[j][i] = { ...tile, patternImage: texture };
          } else {
            newTileStates[j][i] = tile;
          }
        }
      }
      state.tileStates = newTileStates;
    },

    setNavWidth: (state, action) => {
      state.navigationWidth = action.payload;
    },

    setMapData: (state, action) => {
      const { asset, href } = action.payload;
      state.mapData[asset] = href;
    },

    setTexture: (state, action) => {
      const { assetName, imageURL, smallImgURL } = action.payload;
      state.textures[assetName] = {
        imageURL: imageURL,
        smallImgURL: smallImgURL,
      };
    },

    setTextures: (state, action) => {
      let textures = action.payload;
      for (let i = 0; i < textures.length; i++) {
        let { assetName, imageURL, smallImgURL } = textures[i];
        state.textures[assetName] = {
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

export const generateMap =
  (width, height, padding, roomCount, sparsity) => (dispatch, getState) => {
    const generatedTiles = generateTiles(
      width,
      height,
      padding,
      roomCount,
      sparsity
    );
    dispatch(setTilesCondition(generatedTiles));
  };

// Resizing assets function for map drawing
function resizeImage(imageURL, size) {
  return new Promise((resolve) => {
    let img = new window.Image();
    img.onload = () => {
      // Using canvas to resize image
      const canvas = document.createElement("canvas");
      canvas.height = size;
      canvas.width = size;
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0, size, size);

      // Returning blob of small image
      let smallImg = new window.Image();
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
  ({ assetName, imageURL }) =>
  async (dispatch, getState) => {
    const state = getState();
    let size = state.map.size;
    let smallImgURL;
    try {
      smallImgURL = await resizeImage(imageURL, size);
      dispatch(setTexture({ assetName, imageURL, smallImgURL }));
    } catch (error) {
      console.log({ error });
    }
  };

export const setResolution = (size) => async (dispatch, getState) => {
  let state = getState();
  let textures = state.map.textures;
  let textureAssets = Object.keys(textures);

  // Resizing all loaded textures
  try {
    let newTextures = [];
    for (let i = 0; i < textureAssets.length; i++) {
      let asset = textureAssets[i];
      let newSmallImgURL = await resizeImage(textures[asset]["imageURL"], size);
      newTextures.push({
        assetName: asset,
        imageURL: textures[asset]["imageURL"],
        smallImgURL: newSmallImgURL,
      });
    }
    dispatch(setTextures(newTextures));
    dispatch(setSize(size));
  } catch (error) {
    console.log({ error });
  }
};

export const exportFiles = (dataURL) => (dispatch, getState) => {
  const state = getState();
  let { size, tileStates, width, height, navigationWidth } = state.map;

  let image_str = dataURL.split(",")[1];

  const min_size = 100;

  // Initialzing object to create Universal VTT file
  const map_output = {};

  map_output["format"] = 0.2;
  map_output["resolution"] = {
    map_origin: {
      x: navigationWidth,
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
        (tileStates[j][i]["floor"] || tileStates[j][i + 1]["floor"]) &&
        !(tileStates[j][i]["floor"] && tileStates[j][i + 1]["floor"])
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
        (tileStates[j][i]["floor"] || tileStates[j + 1][i]["floor"]) &&
        !(tileStates[j][i]["floor"] && tileStates[j + 1][i]["floor"])
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
  let reducedWalls = [];

  let verticalWalls = walls.filter((wall) => wall[0]["x"] === wall[1]["x"]);
  verticalWalls.sort((w1, w2) => {
    return Math.max(w2[0]["y"], w2[1]["y"]) - Math.max(w1[0]["y"], w1[1]["y"]);
  });

  let horizontalWalls = walls.filter((wall) => wall[0]["y"] === wall[1]["y"]);
  horizontalWalls.sort((w1, w2) => {
    return Math.max(w2[0]["x"], w2[1]["x"]) - Math.max(w1[0]["x"], w1[1]["x"]);
  });

  // Simplifying vertical walls
  for (let i = 0; i < verticalWalls.length; i++) {
    if (verticalWalls[i]) {
      let wall = verticalWalls[i];
      for (let j = i + 1; j < verticalWalls.length; j++) {
        if (verticalWalls[j]) {
          let secondWall = verticalWalls[j];
          if (wall[0]["x"] === secondWall[0]["x"]) {
            if (
              wall[0]["y"] === secondWall[0]["y"] ||
              wall[0]["y"] === secondWall[1]["y"] ||
              wall[1]["y"] === secondWall[0]["y"] ||
              wall[1]["y"] === secondWall[1]["y"]
            ) {
              let yCoordinates = [
                wall[0]["y"],
                wall[1]["y"],
                secondWall[0]["y"],
                secondWall[1]["y"],
              ];
              wall[0]["y"] = Math.min(...yCoordinates);
              wall[1]["y"] = Math.max(...yCoordinates);
              verticalWalls[j] = null;
            }
          }
        }
      }
      reducedWalls.push(wall);
    }
  }

  // Simplifiying horizontal walls
  for (let i = 0; i < horizontalWalls.length; i++) {
    if (horizontalWalls[i]) {
      let wall = horizontalWalls[i];
      for (let j = i + 1; j < horizontalWalls.length; j++) {
        if (horizontalWalls[j]) {
          let secondWall = horizontalWalls[j];
          if (wall[0]["y"] === secondWall[0]["y"]) {
            if (
              wall[0]["x"] === secondWall[0]["x"] ||
              wall[0]["x"] === secondWall[1]["x"] ||
              wall[1]["x"] === secondWall[0]["x"] ||
              wall[1]["x"] === secondWall[1]["x"]
            ) {
              let xCoordinates = [
                wall[0]["x"],
                wall[1]["x"],
                secondWall[0]["x"],
                secondWall[1]["x"],
              ];
              wall[0]["x"] = Math.min(...xCoordinates);
              wall[1]["x"] = Math.max(...xCoordinates);
              horizontalWalls[j] = null;
            }
          }
        }
      }
      reducedWalls.push(wall);
    }
  }

  map_output["line_of_sight"] = reducedWalls;

  // Setting other attributes to defualt values for now
  map_output["portals"] = [];
  map_output["environment"] = {
    baked_lighting: true,
    ambient_light: "ffffffff",
  };
  map_output["lights"] = [];

  dispatch(setMapData({ asset: "image", href: dataURL }));

  // Extracting the encoding for VTT

  map_output["image"] = image_str;

  let blob = new Blob([JSON.stringify(map_output, null, 4)], {
    type: "text/plain",
  });

  let dd2vtt_href = window.URL.createObjectURL(blob);
  dispatch(setMapData({ asset: "dd2vtt", href: dd2vtt_href }));
};
