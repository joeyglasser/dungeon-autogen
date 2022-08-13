import "./App.css";
import { Map } from "./components/map/Map";
import { Control } from "./components/control/Control";

import { useSelector } from "react-redux";

import "./styles/css/styles.css";

function App() {
  const texture = useSelector((state) => state.map.textures["tile_background"]);
  return (
    <div className="App">
      <Control></Control>
      <Map />
      <img src={texture} alt="" width="0" height="0"></img>
    </div>
  );
}

export default App;
