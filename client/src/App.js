import "./App.css";
import { Map } from "./features/map/Map";
import { Control } from "./features/map/Control";
import { useSelector } from "react-redux";

import "./styles/css/styles.css";
import { useMediaQuery } from "react-responsive";

function App() {
  let map = Map();
  let nav_width = useSelector((state) => state.map.nav_width);
  const smallWidth = useMediaQuery({ query: "(max-width: 1224px)" });
  const portrait = useMediaQuery({ query: "orientation: portrait" });
  const isMobile = smallWidth || portrait;
  if (isMobile) {
    return (
      <div className="App">
        <div
          id="mobilecontainer"
          // style={mobileDisplay ? {} : { marginLeft: nav_width }}
        ></div>
        <Map></Map>
        <Control></Control>
      </div>
    );
  } else {
    return (
      <div className="App">
        <Control></Control>
        <div id="container" style={{ marginLeft: nav_width }}></div>
        <Map></Map>
      </div>
    );
  }
}

export default App;
