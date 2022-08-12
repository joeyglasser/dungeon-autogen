import React, { Fragment } from "react";
import { Stage } from "react-konva";
import { Grid } from "./Grid";
import { useSelector } from "react-redux";
import store from "../../store";
import { Provider } from "react-redux";

export const Map = () => {
  const width = useSelector((state) => state.map.width);
  const height = useSelector((state) => state.map.height);
  const size = useSelector((state) => state.map.size);
  const tile_states = useSelector((state) => state.map.tile_states);

  // Getting reference of stage to call function to export image
  const stageRef = React.useRef(null);

  function exportMap() {
    // Initialzing object to create Universal VTT file
    const map_output = {};

    map_output["format"] = 0.2;
    map_output["resolution"] = {
      map_origin: {
        x: 0,
        y: 0,
      },
      map_size: {
        x: width,
        y: height,
      },
      pixels_per_grid: Math.max(size, 50),
    };

    // Adding walls from tile boundaries
    let walls = [];
    for (let i = 0; i < width - 1; i++) {
      for (let j = 0; j < height - 1; j++) {
        // Checks for boudary on the right side of the tile and below the tile
        if (
          (tile_states[j][i]["on"] || tile_states[j][i + 1]["on"]) &&
          !(tile_states[j][i]["on"] && tile_states[j][i + 1]["on"])
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
          (tile_states[j][i]["on"] || tile_states[j + 1][i]["on"]) &&
          !(tile_states[j][i]["on"] && tile_states[j + 1][i]["on"])
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

    // Need to use same offsets used when drawing image
    // TODO: Make this dynamic
    const x_offset = (window.innerWidth - size * width) / 2;
    const y_offset = window.innerHeight / 20;

    // Scaling image to meet minimum size for Universal VTT
    let scale = size < 50 ? 50 / size : size;

    // Extracting image
    const url = stageRef.current.toDataURL({
      x: x_offset,
      y: y_offset,
      width: width * size,
      height: height * size,
      pixelRatio: scale,
    });

    // Extracting just the encoding for VTT
    let image_str = url.split(",")[1];

    map_output["image"] = image_str;

    // Downloading the file
    let blob = new Blob([JSON.stringify(map_output, null, 4)], {
      type: "text/plain",
    });
    var link = document.createElement("a");
    link.download = "map.dd2vtt";
    link.href = window.URL.createObjectURL(blob);
    link.click();
  }
  return (
    <Fragment>
      {" "}
      <Stage
        width={Math.max(window.innerWidth, width * size)}
        height={(height + 1) * size + window.innerHeight / 20}
        ref={stageRef}
      >
        <Provider store={store}>
          <Grid></Grid>
        </Provider>
      </Stage>
      <button
        onClick={(e) => {
          e.preventDefault();
          exportMap();
        }}
      >
        {" "}
        Export
      </button>
    </Fragment>
  );
};
