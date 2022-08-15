function generateRooms(width, height, padding, room_count) {
  const rooms = [];
  const min_dimension = 2;
  const max_dimension = 30;

  // Generating nonoverlapping rooms
  for (let i = 0; i < room_count; i++) {
    // Generating random room
    let x1,
      y1,
      x2,
      y2 = 0;
    x1 = Math.floor(Math.random() * (width - 2 - min_dimension)) + 1;
    y1 = Math.floor(Math.random() * (height - 2 - min_dimension)) + 1;
    x2 = Math.max(
      Math.floor(
        Math.random() *
          Math.min(width - 2 - x1 - min_dimension, max_dimension) +
          x1
      ),
      min_dimension + x1
    );
    y2 = Math.max(
      Math.floor(
        Math.random() *
          Math.min(height - 2 - y1 - min_dimension, max_dimension) +
          y1
      ),
      min_dimension + y1
    );

    // Detecting if room collides with previous room
    let collision = false;
    for (let j = 0; j < rooms.length; j++) {
      let room = rooms[j];
      let { x1: r_x1, y1: r_y1, x2: r_x2, y2: r_y2 } = room;
      if (
        x1 >= r_x1 - padding &&
        x1 <= r_x2 + padding &&
        y1 <= r_y2 + padding
      ) {
        if (y2 >= r_y1 - padding) {
          collision = true;
          break;
        }
      } else if (
        x2 >= r_x1 - padding &&
        x2 <= r_x2 + padding &&
        y2 >= r_y1 - padding
      ) {
        if (y1 <= r_y2 + padding) {
          collision = true;
          break;
        }
      } else if (
        r_x1 >= x1 - padding &&
        r_x1 <= x2 + padding &&
        r_y1 <= y2 + padding
      ) {
        if (r_y2 >= y1 - padding) {
          collision = true;
          break;
        }
      } else if (
        r_x2 >= x1 - padding &&
        r_x2 <= x2 + padding &&
        r_y2 >= y1 - padding
      ) {
        if (r_y1 <= y2 + padding) {
          collision = true;
          break;
        }
      }
    }
    if (!collision) {
      rooms.push({ x1, y1, x2, y2 });
    }
  }
  return rooms;
}

export function generateTiles(width, height, padding) {
  let rooms = generateRooms(width, height, padding, 1000);

  // Initializng tile states
  const tile_states = [...Array(height)].map((e) =>
    Array(width)
      .fill()
      .map((u) => ({
        room: 0,
        floor: false,
        color: "black",
        patternAsset: "background",
      }))
  );

  // Marking tiles based off of rooms
  for (let i = 0; i < rooms.length; i++) {
    let { x1, y1, x2, y2 } = rooms[i];
    for (let x = x1; x < x2 + 1; x++) {
      for (let y = y1; y < y2 + 1; y++) {
        tile_states[y][x] = {
          room: 0,
          floor: true,
          color: "white",
          patternAsset: "flooring",
        };
      }
    }
  }

  // Labeling rooms using dfs
  let room_index = 0;
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (tile_states[j][i]["floor"] && tile_states[j][i]["room"] === 0) {
        room_index += 1;
        let stack = [];
        stack.push([i, j]);

        while (stack.length > 0) {
          let coord = stack.pop();
          let x = coord[0];
          let y = coord[1];

          tile_states[y][x]["room"] = room_index;

          let neighbor_coords = [];
          neighbor_coords.push([x + 1, y]);
          neighbor_coords.push([x, y - 1]);
          neighbor_coords.push([x - 1, y]);
          neighbor_coords.push([x, y + 1]);

          for (let k = 0; k < neighbor_coords.length; k++) {
            let n_x = neighbor_coords[k][0];
            let n_y = neighbor_coords[k][1];

            if (n_x >= 0 && n_x < width && n_y >= 0 && n_y < height) {
              if (
                tile_states[n_y][n_x]["floor"] &&
                tile_states[n_y][n_x]["room"] === 0
              ) {
                stack.push([n_x, n_y]);
              }
            }
          }
        }
      }
    }
  }

  // Computing room statistics
  const room_stats = [...Array(room_index + 1)]
    .fill()
    .map((e) => ({ size: 0, x_avg: 0, y_avg: 0, x_node: 0, y_node: 0 }));

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let tile_room = tile_states[j][i]["room"];
      room_stats[tile_room]["size"]++;
      room_stats[tile_room]["x_avg"] += i;
      room_stats[tile_room]["y_avg"] += j;
      room_stats[tile_room]["x_node"] = i;
      room_stats[tile_room]["y_node"] = j;
    }
  }

  for (let i = 1; i < room_stats.length; i++) {
    room_stats[i]["x_avg"] /= room_stats[i]["size"];
    room_stats[i]["y_avg"] /= room_stats[i]["size"];
  }

  // Use Prim's algorithm to find a minimally spanning tree

  // First storing all distances for computational savings
  const room_distances = [...Array(room_stats.length)].map((e) =>
    Array(room_stats.length)
  );
  for (let i = 0; i < room_stats.length; i++) {
    for (let j = i; j < room_stats.length; j++) {
      let distance = Math.sqrt(
        (room_stats[j]["x_avg"] - room_stats[i]["x_avg"]) ** 2 +
          (room_stats[j]["y_avg"] - room_stats[i]["y_avg"]) ** 2
      );

      room_distances[j][i] = distance;
      room_distances[i][j] = distance;
    }
  }

  const visited_nodes = [1];
  const edges = [];
  // Prim's algo
  while (visited_nodes.length < room_stats.length - 1) {
    let min_distance = Number.POSITIVE_INFINITY;
    let min_source = 0;
    let min_destination = 0;
    for (let i = 0; i < visited_nodes.length; i++) {
      let room = visited_nodes[i];
      for (let j = 1; j < room_stats.length; j++) {
        if (
          j !== room &&
          !visited_nodes.includes(j) &&
          room_distances[j][room] < min_distance
        ) {
          min_destination = j;
          min_distance = room_distances[j][room];
          min_source = room;
        }
      }
    }
    edges.push([min_source, min_destination]);
    visited_nodes.push(min_destination);
  }

  // Add in some extra edges for large rooms
  const avg_room_size =
    room_stats.reduce(
      (previousValue, currentValue) => previousValue + currentValue["size"],
      0
    ) / room_stats.length;

  const large_rooms = [];
  for (let i = 0; i < room_stats.length; i++) {
    if (room_stats[i]["size"] > avg_room_size) {
      large_rooms.push(i);
    }
  }

  for (let i = 0; i < large_rooms.length; i++) {
    let min_distance = Number.POSITIVE_INFINITY;
    let min_room = 0;
    for (let j = 1; j < room_stats.length; j++) {
      if (j !== large_rooms[i]) {
        let edge_exists = false;
        for (let k = 0; k < edges.length; k++) {
          edge_exists =
            edge_exists ||
            (edges[k].includes(large_rooms[i]) && edges[k].includes(j));
        }
        if (!edge_exists) {
          if (room_distances[j][large_rooms[i]] < min_distance) {
            min_room = j;
            min_distance = room_distances[j][large_rooms[i]];
          }
        }
      }
    }
    if (min_room !== 0) {
      edges.push([large_rooms[i], min_room]);
    }
  }

  // Using modified djikstra's algo to find path to neighbors
  for (let i = 1; i < room_stats.length; i++) {
    let targets = [];
    let target_stats = {};

    for (let j = 0; j < edges.length; j++) {
      if (edges[j].includes(i)) {
        targets.push(edges[j][0] === i ? edges[j][1] : edges[j][0]);
        edges[j] = [];
      }
    }

    for (let j = 0; j < room_stats.length; j++) {
      target_stats[j] = {
        x: -1,
        y: -1,
        min_distance: Number.POSITIVE_INFINITY,
      };
    }

    if (targets.length > 0) {
      let shortest_paths = [...Array(height)].map((e) =>
        Array(width).fill(Number.POSITIVE_INFINITY)
      );
      let stack = [[room_stats[i]["x_node"], room_stats[i]["y_node"]]];
      shortest_paths[room_stats[i]["y_node"]][room_stats[i]["x_node"]] = 0;
      while (stack.length > 0) {
        let coord = stack.pop();
        let x = coord[0];
        let y = coord[1];
        let coord_distance = shortest_paths[y][x];

        let neighbors = [
          [x + 1, y],
          [x, y - 1],
          [x - 1, y],
          [x, y + 1],
        ];

        for (let j = 0; j < neighbors.length; j++) {
          let neighbor_coords = neighbors[j];
          let n_x = neighbor_coords[0];
          let n_y = neighbor_coords[1];
          if (n_x >= 0 && n_x < width && n_y >= 0 && n_y < height) {
            if (!Number.isFinite(shortest_paths[n_y][n_x])) {
              stack.unshift([n_x, n_y]);
            }

            if (coord_distance + 1 < shortest_paths[n_y][n_x]) {
              if (tile_states[n_y][n_x]["room"] === i) {
                shortest_paths[n_y][n_x] = 0;
              } else {
                shortest_paths[n_y][n_x] = coord_distance + 1;
              }
            }

            // Getting coordinate of each room closest to source room
            if (
              shortest_paths[n_y][n_x] <
              target_stats[tile_states[n_y][n_x]["room"]]["min_distance"]
            ) {
              target_stats[tile_states[n_y][n_x]["room"]]["min_distance"] =
                shortest_paths[n_y][n_x];
              target_stats[tile_states[n_y][n_x]["room"]]["x"] = n_x;
              target_stats[tile_states[n_y][n_x]["room"]]["y"] = n_y;
            }
          }
        }
      }

      // Making hallways between rooms using shortest path
      for (let j = 0; j < targets.length; j++) {
        let x = target_stats[targets[j]]["x"];
        let y = target_stats[targets[j]]["y"];
        let distance = shortest_paths[y][x];

        while (distance > 0) {
          let neighbors = [
            [x + 1, y],
            [x, y - 1],
            [x - 1, y],
            [x, y + 1],
          ];

          for (let j = 0; j < neighbors.length; j++) {
            let neighbor_coords = neighbors[j];
            let n_x = neighbor_coords[0];
            let n_y = neighbor_coords[1];
            if (n_x >= 0 && n_x < width && n_y >= 0 && n_y < height) {
              if (shortest_paths[n_y][n_x] === distance - 1) {
                tile_states[n_y][n_x]["color"] = "white";
                tile_states[n_y][n_x]["floor"] = true;
                tile_states[n_y][n_x]["patternAsset"] = "flooring";
                distance--;
                x = n_x;
                y = n_y;
                break;
              }
            }
          }
        }
      }
    }
  }
  return tile_states;
}
