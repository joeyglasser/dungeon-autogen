import "./App.css";
import { Map } from "./features/map/Map";
import { Control } from "./features/map/Control";
import { generateMap } from "./features/map/mapSlice";
import { useSelector, useDispatch } from "react-redux";

import "./styles/css/styles.css";
import { useMediaQuery } from "react-responsive";

function App() {
  const dispatch = useDispatch();
  dispatch(generateMap(30, 30, 1, 20, 2));

  let navigationWidth = useSelector((state) => state.map.navigationWidth);
  const smallWidth = useMediaQuery({ query: "(max-width: 1224px)" });
  const portrait = useMediaQuery({ query: "orientation: portrait" });
  const isMobile = smallWidth || portrait;
  if (isMobile) {
    return (
      <div className="App">
        <div id="mobilecontainer"></div>
        <Map></Map>
        <Control></Control>
      </div>
    );
  } else {
    return (
      <div className="App">
        <Control></Control>
        <div id="container" style={{ marginLeft: navigationWidth }}></div>
        <Map></Map>
      </div>
    );
  }
}

export default App;
