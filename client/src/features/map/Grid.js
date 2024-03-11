import { Layer, Rect } from "react-konva";

/**
 * Creates the html that is displayed for the grid
 * @param {int} size the pixel width of the grid
 * @param {{Array<Array <room: int, floor: bool, color: string, patternAsset: string>>}} tileStates the data that dictatates how tiles appear
 * @param {Object<Object<smallImgURL: strinig>} textures contains assets and the Image url of the associated texture
 * @param {*} xOffset how much offset there is in the grid on the display from the left side
 * @param {*} yOffset how much offset there is in the grid on the display from the top
 * @returns {Promise<html>} a promise that resolves with the html to display the grid
 */
function makeGrid({ size, tileStates, textures, xOffset, yOffset }) {
  // If there are no textures, simply generate the html for the tiles with just the color
  if (Object.keys(textures).length === 0) {
    let tiles = [];
    for (let i = 0; i < tileStates[0].length; i++) {
      for (let j = 0; j < tileStates.length; j++) {
        let fill = tileStates[j][i]["color"];

        tiles.push(
          <Rect
            x={i * size + xOffset}
            y={j * size + yOffset}
            width={size}
            height={size}
            stroke="black"
            fill={fill}
            key={`${i}_${j}_tile`}
            strokeWidth={tileStates[j][i]["on"] ? 1 / 10 : 1}
          ></Rect>
        );
      }
    }

    return Promise.resolve(<Layer>{tiles}</Layer>);
  }

  // Helper function to load the images for each asset
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

      for (let i = 0; i < tileStates[0].length; i++) {
        for (let j = 0; j < tileStates.length; j++) {
          let fill = tileStates[j][i]["color"];
          let tileAsset = tileStates[j][i]["patternAsset"];

          let patternImage = null;
          let strokeWidth = tileStates[j][i]["flooring"] ? 1 / 5 : 1;

          if (asset_images[tileAsset]) {
            patternImage = asset_images[tileAsset];
            fill = null;
            strokeWidth = tileStates[j][i]["flooring"] ? 1 / 5 : 0;
          }

          tiles.push(
            <Rect
              x={i * size + xOffset}
              y={j * size + yOffset}
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

export { makeGrid };
