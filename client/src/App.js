import "./App.css";
import { Map } from "./features/map/Map";
import { Control } from "./features/map/Control";

import "./styles/css/styles.css";

function App() {
  return (
    <div className="App">
      <Control></Control>
      <Map />
    </div>
  );
}

export default App;
