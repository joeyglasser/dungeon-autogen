import "./App.css";
import { Map } from "./components/map/Map";
import { Control } from "./components/control/Control";
function App() {
  return (
    <div className="App">
      <Control></Control>
      <Map />
    </div>
  );
}

export default App;
