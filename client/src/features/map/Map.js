import React, { Fragment, useState, useEffect } from "react";
import { Layer, Stage } from "react-konva";
import { makeGrid } from "./Grid";
import { useSelector, useDispatch } from "react-redux";
import { exportFiles } from "./mapSlice";

export const Map = () => {
  const dispatch = useDispatch();
  const width = useSelector((state) => state.map.width);
  const height = useSelector((state) => state.map.height);
  const size = useSelector((state) => state.map.size);
  const tile_states = useSelector((state) => state.map.tile_states);
  const textures = useSelector((state) => state.map.textures);
  const nav_width = useSelector((state) => state.map.nav_width);
  const [grid, setGrid] = useState(<Layer></Layer>);

  // Getting reference of stage to call function to export image
  const stageRef = React.useRef(null);

  const x_offset = Math.max(
    (window.innerWidth - nav_width - width * size) / 2,
    0
  );
  const y_offset = Math.max((window.innerHeight - height * size) / 2, 0);

  useEffect(() => {
    let renderingGrid = makeGrid({
      size: size,
      tile_states: tile_states,
      textures: textures,
      x_offset: x_offset,
      y_offset: y_offset,
    });

    renderingGrid.then((renderedGrid) => {
      setGrid(renderedGrid);

      dispatch(exportFiles({ stage: stageRef.current, x_offset, y_offset }));
    });
  }, [dispatch, size, tile_states, textures, x_offset, y_offset]);

  const rendered_grid = (
    <Fragment>
      <Stage
        width={Math.max(window.innerWidth, width * size + nav_width)}
        height={Math.max(window.innerHeight, height * size)}
        ref={stageRef}
        x={nav_width}
      >
        {grid}
      </Stage>
    </Fragment>
  );

  return rendered_grid;
};
