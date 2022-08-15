import "./App.css";
import { Map } from "./features/map/Map";
import { Control } from "./features/map/Control";
import { useSelector } from "react-redux";

import "./styles/css/styles.css";

function App() {
  let map = Map();
  let nav_width = useSelector((state) => state.map.nav_width);
  return (
    <div className="App">
      <Control></Control>
      <div id="container" style={{ marginLeft: nav_width }}></div>
      <Map></Map>
    </div>
  );
}

export default App;
