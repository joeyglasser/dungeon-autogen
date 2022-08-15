import { Layer, Rect } from "react-konva";

// Generates layer of tiles composing the map grid as a promise
// Need as a promise to load the assets to draw onto the tiles
export function makeGrid({ size, tile_states, textures, x_offset, y_offset }) {
  if (Object.keys(textures).length === 0) {
    let tiles = [];
    for (let i = 0; i < tile_states[0].length; i++) {
      for (let j = 0; j < tile_states.length; j++) {
        let fill = tile_states[j][i]["color"];

        tiles.push(
          <Rect
            x={i * size + x_offset}
            y={j * size + y_offset}
            width={size}
            height={size}
            stroke="black"
            fill={fill}
            key={`${i}_${j}_tile`}
            strokeWidth={tile_states[j][i]["on"] ? 1 / 10 : 1}
          ></Rect>
        );
      }
    }

    return Promise.resolve(<Layer>{tiles}</Layer>);
  }

  const loadImagePromise = (asset, imgSrc) => {
    return new Promise((resolve) => {
      let img = new window.Image();
      img.onload = () => {
        resolve({ asset, img });
      };
      img.src = imgSrc;
    });
  };

  return new Promise((resolve) => {
    let assets = Object.keys(textures);
    let assetPromises = [];
    for (let i = 0; i < assets.length; i++) {
      assetPromises.push(
        loadImagePromise(assets[i], textures[assets[i]]["smallImgURL"])
      );
    }

    // Once all images are loaded, the tiles are created
    Promise.all(assetPromises).then((values) => {
      let asset_images = {};

      // Storing assets in an object for reference
      for (let i = 0; i < values.length; i++) {
        let { asset, img } = values[i];
        asset_images[asset] = img;
      }

      let tiles = [];

      for (let i = 0; i < tile_states[0].length; i++) {
        for (let j = 0; j < tile_states.length; j++) {
          let fill = tile_states[j][i]["color"];
          let tileAsset = tile_states[j][i]["patternAsset"];

          let patternImage = null;
          let strokeWidth = tile_states[j][i]["flooring"] ? 1 / 5 : 1;

          if (asset_images[tileAsset]) {
            patternImage = asset_images[tileAsset];
            fill = null;
            strokeWidth = tile_states[j][i]["flooring"] ? 1 / 5 : 0;
          }

          tiles.push(
            <Rect
              x={i * size + x_offset}
              y={j * size + y_offset}
              width={size}
              height={size}
              stroke="black"
              fill={fill}
              key={`${i}_${j}_tile`}
              fillPatternImage={patternImage}
              strokeWidth={strokeWidth}
            ></Rect>
          );
        }
      }
      resolve(<Layer>{tiles}</Layer>);
    });
  });
}
