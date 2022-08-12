import React from "react";
import { Layer, Rect } from "react-konva";
import { useSelector } from "react-redux";

export const Grid = () => {
  const width = useSelector((state) => state.map.width);
  const size = useSelector((state) => state.map.size);
  const tile_states = useSelector((state) => state.map.tile_states);

  const x_offset = (window.innerWidth - size * width) / 2;
  const y_offset = window.innerHeight / 20;

  let tiles = [];

  // Rendering tiles and adding to array
  for (let i = 0; i < tile_states[0].length; i++) {
    for (let j = 0; j < tile_states.length; j++) {
      tiles.push(
        <Rect
          x={i * size + x_offset}
          y={j * size + y_offset}
          width={size}
          height={size}
          stroke="black"
          fill={tile_states[j][i]["color"]}
          key={String(i) + "_" + String(j)}
        ></Rect>
      );
    }
  }
  return <Layer>{tiles}</Layer>;
};
