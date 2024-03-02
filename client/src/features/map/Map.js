import React, { Fragment, useState, useEffect } from "react";
import { Layer, Stage } from "react-konva";
import { makeGrid } from "./Grid";
import { useSelector, useDispatch } from "react-redux";
import { exportFiles } from "./mapSlice";
import { useMediaQuery } from "react-responsive";

export const Map = () => {
  const dispatch = useDispatch();
  const width = useSelector((state) => state.map.width);
  const height = useSelector((state) => state.map.height);
  const size = useSelector((state) => state.map.size);
  const tile_states = useSelector((state) => state.map.tile_states);
  const textures = useSelector((state) => state.map.textures);
  const nav_width = useSelector((state) => state.map.nav_width);
  const smallWidth = useMediaQuery({ query: "(max-width: 1224px)" });
  const portrait = useMediaQuery({ query: "orientation: portrait" });
  const isMobile = smallWidth || portrait;

  // Using these to rerender component once to get updated stage for exporting image
  const [loading, setLoading] = useState(true);
  const [toggle, setToggle] = useState(true);
  const [grid, setGrid] = useState(<Layer></Layer>);

  // Getting reference of stage to call function to export image
  const stageRef = React.useRef(null);

  // Calculating stage offsets to center map
  let x_offset = 0;
  if (isMobile) {
    x_offset = Math.max((window.innerWidth - width * size) / 2, 0);
  } else {
    x_offset = Math.max((window.innerWidth - nav_width - width * size) / 2, 0);
  }
  const y_offset = Math.max((window.innerHeight - height * size) / 2, 0);

  // Rerendering and then dispatching action to save image
  useEffect(() => {
    let renderingGrid = makeGrid({
      size: size,
      tile_states: tile_states,
      textures: textures,
      x_offset: 0,
      y_offset: y_offset,
    });

    renderingGrid.then(async (renderedGrid) => {
      setGrid(renderedGrid);
      if (loading) {
        setLoading(false);
        setToggle(!toggle);
      } else {
        // Resetting loading so next time component updates it will rerender again
        setLoading(true);

        if (stageRef.current) {
          // Setting minimum size for dd2vtt compatibility
          const min_size = 100;
          let scale = size < min_size ? min_size / size : 1;

          // Getting image data
          const dataURL = stageRef.current.toDataURL({
            x: x_offset,
            y: y_offset,
            width: width * size,
            height: height * size,
            pixelRatio: scale,
            imageSmoothingEnabled: false,
            quality: 1 / 10,
          });
          dispatch(exportFiles(dataURL));
        }
      }
    });

    // loading outside of depencies but necessary to rerender only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    size,
    tile_states,
    textures,
    x_offset,
    y_offset,
    height,
    width,
    nav_width,
    toggle,
  ]);

  const rendered_grid = (
    <Fragment>
      <Stage
        width={
          isMobile
            ? Math.max(window.innerWidth, width * size)
            : Math.max(window.innerWidth - nav_width, width * size)
        }
        height={
          isMobile
            ? Math.max(window.innerHeight * 0.92, height * size * 0.92)
            : Math.max(window.innerHeight, height * size)
        }
        ref={stageRef}
        x={x_offset}
        container={isMobile ? "mobilecontainer" : "container"}
      >
        {grid}
      </Stage>
    </Fragment>
  );

  return rendered_grid;
};
