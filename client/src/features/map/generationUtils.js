/**
 * Generates an array of "rooms" which are objects that contain 4 coordinates denoting teh
 * corners of a room in a 2d space
 * @param {int} width the width of the space to generate rooms in
 * @param {int} height the height of the space to generate rooms in
 * @param {int} padding the minimum number of spaces between rooms
 * @param {int} roomCount number of rooms we attempt to generate. Can be less if not enough room
 * given the parameters
 * @param {float} sparsity controls how many rooms from which we attempt to generate. Example:
 * if the sparsity is 2.0 and the number of rooms is 10, the algorithm will split the entire
 * space into 20 rooms and return the largest 10
 * @param {int} minDimension the minimum height/width of each room
 * @returns {Array<{x1: int, x2: int, y1: int, y2: int}>} array of coordinates of a room
 */
function generateRooms(
  width,
  height,
  padding,
  roomCount,
  sparsity,
  minDimension = 2
) {
  // Initializing rooms
  let rooms = [];

  // Calculating half the padding to use for boundary validation
  let halfPadding = Math.ceil(padding / 2);

  // Helper function to find a valid room split given some range, padding, and dimension requirements
  const findSplit = (range, halfPadding, minDimension) => {
    if (range - 2 * halfPadding - 2 * minDimension > 0) {
      return (
        Math.floor(
          Math.random() * (range - 2 * halfPadding - 2 * minDimension)
        ) +
        halfPadding +
        minDimension
      );
    } else {
      return null;
    }
  };

  // Initializing with 2 rooms along the largest dimension
  if (width > height) {
    let split = findSplit(width, halfPadding, minDimension);
    rooms.push({ x1: 0, x2: split - 1, y1: 0, y2: height - 1 });
    rooms.push({ x1: split, x2: width - 1, y1: 0, y2: height - 1 });
  } else {
    let split = findSplit(height, halfPadding, minDimension);
    rooms.push({ x1: 0, x2: width - 1, y1: 0, y2: split - 1 });
    rooms.push({ x1: 0, x2: width - 1, y1: split, y2: height - 1 });
  }

  // Storing rooms that are too small to be split further
  let smallRooms = [];

  // Generating rooms until they're too small or there are enough
  // Use a queue to split rooms so that we generally split larger
  // rooms before smaller ones
  while (rooms.length > 0 && rooms.length < roomCount * sparsity) {
    let { x1, x2, y1, y2 } = rooms.shift();

    // Split along largest dimension (width or height)
    // Then find a valid split point and add the two smaller rooms
    // to the queue. If there isn't a valid split point, add the room
    // to the smallRooms array
    if (y2 - y1 > x2 - x1) {
      let split = findSplit(y2 - y1, halfPadding, minDimension);
      if (split !== null) {
        rooms.push({ x1: x1, x2: x2, y1: y1, y2: y1 + split - 1 });
        rooms.push({ x1: x1, x2: x2, y1: y1 + split, y2: y2 });
      } else {
        smallRooms.push({ x1, x2, y1, y2 });
      }
    } else {
      let split = findSplit(x2 - x1, halfPadding, minDimension);
      if (split !== null) {
        rooms.push({ x1: x1, x2: x1 + split - 1, y1: y1, y2: y2 });
        rooms.push({ x1: x1 + split, x2: x2, y1: y1, y2: y2 });
      } else {
        smallRooms.push({ x1, x2, y1, y2 });
      }
    }
  }

  // Adding back in small rooms
  rooms = [...rooms, ...smallRooms];

  // Reduce room size to enforce padding restrictions
  for (const room of rooms) {
    room.x1 = room.x1 + halfPadding;
    room.x2 = room.x2 - halfPadding;
    room.y1 = room.y1 + halfPadding;
    room.y2 = room.y2 - halfPadding;
  }

  // Sorting by largest rooms
  rooms.sort(
    (r1, r2) =>
      (r2.x2 - r2.x1) * (r2.y2 - r2.y1) - (r1.x2 - r1.x1) * (r1.y2 - r1.y1)
  );

  // Returning largest rooms
  let biggestRooms = [];
  for (let i = 0; i < Math.min(roomCount, rooms.length); i++) {
    biggestRooms.push(rooms[i]);
  }

  return biggestRooms;
}

/**
 * Generates an array that contains the data for the tiles that appear
 * as the map given input parameters. The data denotes which room the
 * tiles are a part of if any, if it's the floor or background,
 * what color they are, and what asset name is attached to the tile. The
 * function randomly generates a room layout, finds the minimum paths
 * between rooms and generates hallways using Prim's algorithm. The,
 * function also adds extra paths between large rooms and rooms around it.
 * @param {int} width the width of the space to generate rooms in
 * @param {int} height the height of the space to generate rooms in
 * @param {int} padding the minimum number of spaces between rooms
 * @param {int} roomCount number of rooms we attempt to generate. Can be less if not enough room
 * given the parameters
 * @param {float} sparsity controls how many rooms from which we attempt to generate. Example:
 * if the sparsity is 2.0 and the number of rooms is 10, the algorithm will split the entire
 * space into 20 rooms and return the largest 10
 * @returns {Array<room: int, floor: bool, color: string, patternAsset: string>}
 */
export function generateTiles(width, height, padding, roomCount, sparsity) {
  // Randomly generate rooms which we'll use to mark the tiles
  let rooms = generateRooms(width, height, padding, roomCount, sparsity);

  // Initializng tile states
  const tileStates = [...Array(height)].map((e) =>
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
        tileStates[y][x] = {
          room: 0,
          floor: true,
          color: "white",
          patternAsset: "flooring",
        };
      }
    }
  }

  // Labeling rooms using depth first search
  let roomIndex = 0;
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      if (tileStates[j][i]["floor"] && tileStates[j][i]["room"] === 0) {
        roomIndex += 1;
        let stack = [];
        stack.push([i, j]);

        while (stack.length > 0) {
          let coord = stack.pop();
          let x = coord[0];
          let y = coord[1];

          tileStates[y][x]["room"] = roomIndex;

          let neighborCoordinates = [];
          neighborCoordinates.push([x + 1, y]);
          neighborCoordinates.push([x, y - 1]);
          neighborCoordinates.push([x - 1, y]);
          neighborCoordinates.push([x, y + 1]);

          for (let k = 0; k < neighborCoordinates.length; k++) {
            let nX = neighborCoordinates[k][0];
            let nY = neighborCoordinates[k][1];

            if (nX >= 0 && nX < width && nY >= 0 && nY < height) {
              if (
                tileStates[nY][nX]["floor"] &&
                tileStates[nY][nX]["room"] === 0
              ) {
                stack.push([nX, nY]);
              }
            }
          }
        }
      }
    }
  }

  // Computing room statistics
  const roomStats = [...Array(roomIndex + 1)]
    .fill()
    .map((e) => ({ size: 0, xAvg: 0, yAvg: 0, xNode: 0, yNode: 0 }));

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let tileRoom = tileStates[j][i]["room"];
      roomStats[tileRoom]["size"]++;
      roomStats[tileRoom]["xAvg"] += i;
      roomStats[tileRoom]["yAvg"] += j;
      roomStats[tileRoom]["xNode"] = i;
      roomStats[tileRoom]["yNode"] = j;
    }
  }

  for (let i = 1; i < roomStats.length; i++) {
    roomStats[i]["xAvg"] /= roomStats[i]["size"];
    roomStats[i]["yAvg"] /= roomStats[i]["size"];
  }

  // Using Prim's algorithm to find a minimally spanning tree

  // First storing all distances for computational savings
  const roomDistances = [...Array(roomStats.length)].map((e) =>
    Array(roomStats.length)
  );
  for (let i = 0; i < roomStats.length; i++) {
    for (let j = i; j < roomStats.length; j++) {
      let distance = Math.sqrt(
        (roomStats[j]["xAvg"] - roomStats[i]["xAvg"]) ** 2 +
          (roomStats[j]["yAvg"] - roomStats[i]["yAvg"]) ** 2
      );

      roomDistances[j][i] = distance;
      roomDistances[i][j] = distance;
    }
  }

  const visitedNodes = [1];
  const edges = [];
  // Prim's algorithm
  while (visitedNodes.length < roomStats.length - 1) {
    let minDistance = Number.POSITIVE_INFINITY;
    let minSource = 0;
    let minDestination = 0;
    for (let i = 0; i < visitedNodes.length; i++) {
      let room = visitedNodes[i];
      for (let j = 1; j < roomStats.length; j++) {
        if (
          j !== room &&
          !visitedNodes.includes(j) &&
          roomDistances[j][room] < minDistance
        ) {
          minDestination = j;
          n_y;
          minDistance = roomDistances[j][room];
          minSource = room;
        }
      }
    }
    edges.push([minSource, minDestination]);
    visitedNodes.push(minDestination);
  }

  // Add in some extra edges for large rooms
  const avgRoomSize =
    roomStats.reduce(
      (previousValue, currentValue) => previousValue + currentValue["size"],
      0
    ) / roomStats.length;

  const largeRooms = [];
  for (let i = 0; i < roomStats.length; i++) {
    if (roomStats[i]["size"] > avgRoomSize) {
      largeRooms.push(i);
    }
  }

  for (let i = 0; i < largeRooms.length; i++) {
    let minDistance = Number.POSITIVE_INFINITY;
    let minRoom = 0;
    for (let j = 1; j < roomStats.length; j++) {
      if (j !== largeRooms[i]) {
        let edgeExists = false;
        for (let k = 0; k < edges.length; k++) {
          edgeExists =
            edgeExists ||
            (edges[k].includes(largeRooms[i]) && edges[k].includes(j));
        }
        if (!edgeExists) {
          if (roomDistances[j][largeRooms[i]] < minDistance) {
            minRoom = j;
            minDistance = roomDistances[j][largeRooms[i]];
          }
        }
      }
    }
    if (minRoom !== 0) {
      edges.push([largeRooms[i], minRoom]);
    }
  }

  // Using modified djikstra's algo to find path to neighbors
  for (let i = 1; i < roomStats.length; i++) {
    let targets = [];
    let targetStats = {};

    for (let j = 0; j < edges.length; j++) {
      if (edges[j].includes(i)) {
        targets.push(edges[j][0] === i ? edges[j][1] : edges[j][0]);
        edges[j] = [];
      }
    }

    for (let j = 0; j < roomStats.length; j++) {
      targetStats[j] = {
        x: -1,
        y: -1,
        minDistance: Number.POSITIVE_INFINITY,
      };
    }

    if (targets.length > 0) {
      let shortest_paths = [...Array(height)].map((e) =>
        Array(width).fill(Number.POSITIVE_INFINITY)
      );
      let stack = [[roomStats[i]["xNode"], roomStats[i]["yNode"]]];
      shortest_paths[roomStats[i]["yNode"]][roomStats[i]["xNode"]] = 0;
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
          let neighborCoordinates = neighbors[j];
          let nX = neighborCoordinates[0];
          let nY = neighborCoordinates[1];
          if (nX >= 0 && nX < width && nY >= 0 && nY < height) {
            if (!Number.isFinite(shortest_paths[nY][nX])) {
              stack.unshift([nX, nY]);
            }

            if (coord_distance + 1 < shortest_paths[nY][nX]) {
              if (tileStates[nY][nX]["room"] === i) {
                shortest_paths[nY][nX] = 0;
              } else {
                shortest_paths[nY][nX] = coord_distance + 1;
              }
            }

            // Getting coordinate of each room closest to source room
            if (
              shortest_paths[nY][nX] <
              targetStats[tileStates[nY][nX]["room"]]["minDistance"]
            ) {
              targetStats[tileStates[nY][nX]["room"]]["minDistance"] =
                shortest_paths[nY][nX];
              targetStats[tileStates[nY][nX]["room"]]["x"] = nX;
              targetStats[tileStates[nY][nX]["room"]]["y"] = nY;
            }
          }
        }
      }

      // Making hallways between rooms using shortest path
      for (let j = 0; j < targets.length; j++) {
        let x = targetStats[targets[j]]["x"];
        let y = targetStats[targets[j]]["y"];
        let distance = shortest_paths[y][x];

        while (distance > 0) {
          let neighbors = [
            [x + 1, y],
            [x, y - 1],
            [x - 1, y],
            [x, y + 1],
          ];

          for (let j = 0; j < neighbors.length; j++) {
            let neighborCoordinates = neighbors[j];
            let nX = neighborCoordinates[0];
            let nY = neighborCoordinates[1];
            if (nX >= 0 && nX < width && nY >= 0 && nY < height) {
              if (shortest_paths[nY][nX] === distance - 1) {
                tileStates[nY][nX]["color"] = "white";
                tileStates[nY][nX]["floor"] = true;
                tileStates[nY][nX]["patternAsset"] = "flooring";
                distance--;
                x = nX;
                y = nY;
                break;
              }
            }
          }
        }
      }
    }
  }
  return tileStates;
}
