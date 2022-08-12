import React from "react";
import { Layer, Rect } from "react-konva";
import { useSelector } from "react-redux";
export const Grid = () => {
  const width = useSelector((state) => state.map.width);
  const size = useSelector((state) => state.map.size);
  const tile_states = useSelector((state) => state.map.tile_states);
  const textures = useSelector((state) => state.map.textures);

  const x_offset = (window.innerWidth - size * width) / 2;
  const y_offset = window.innerHeight / 20;

  function getTexture(textures, id) {
    if (textures[id] == null) {
      return null;
    }
    let tile_background = new window.Image();
    let texture = textures[id];
    tile_background.src = texture;
    //   tile_background.src = RockImg;
    console.log(tile_background.src);
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    context.drawImage(tile_background, 0, 0, size, size);
    tile_background.src = canvas.toDataURL("jpg");
    return tile_background;
  }

  let tile_background = getTexture(textures, "tile_background");

  // Rendering tiles and adding to array
  let tiles = [];
  for (let i = 0; i < tile_states[0].length; i++) {
    for (let j = 0; j < tile_states.length; j++) {
      tiles.push(
        <Rect
          x={i * size + x_offset}
          y={j * size + y_offset}
          width={size}
          height={size}
          stroke="black"
          //   strokeEnabled={tile_states[j][i]["on"]}
          fill={tile_states[j][i]["on"] ? null : tile_states[j][i]["color"]}
          fillPatternImage={tile_states[j][i]["on"] ? tile_background : null}
          key={String(i) + "_" + String(j)}
          strokeWidth={tile_states[j][i]["on"] ? 1 / 10 : 1}
        ></Rect>
      );
    }
  }
  return <Layer>{tiles}</Layer>;
};
