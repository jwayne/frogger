import React from "react";
import { Animate } from "react-move";
import { easeLinear } from "d3-ease";
import "./App.css";

class App extends React.Component {
  render() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh"
        }}
      >
        <Game />
      </div>
    );
  }
}

// lanes can be water, grass, or road.
// `Game` will always insert a grass lane at the top and bottom of the map.
const laneTypes = ["w", "w", "w", "w", "w", "g", "r", "r", "r", "r", "r"];
const frogSize = 60;

class Game extends React.Component {
  constructor(props) {
    super(props);

    this.numLanes = laneTypes.length + 2
    this.gameWidth = 800;
    this.gameHeight = frogSize * this.numLanes;
    this.frogStartX = (this.gameWidth - frogSize) / 2;
    this.frogStartLane = this.numLanes - 1;

    this.state = {
      frogX: this.frogStartX,
      frogLane: this.frogStartLane,
      frogDir: 0
    };
  }

  handleKeyDown = e => {
    switch (e.key) {
      case "ArrowUp":
        this.setState(state => ({
          frogLane: state.frogLane - 1,
          frogDir: 0
        }));
        break;
      case "ArrowDown":
        this.setState(state => ({
          frogLane: state.frogLane + 1,
          frogDir: 180
        }));
        break;
      case "ArrowLeft":
        this.setState(state => ({
          frogX: state.frogX - frogSize,
          frogDir: 270
        }));
        break;
      case "ArrowRight":
        this.setState(state => ({
          frogX: state.frogX + frogSize,
          frogDir: 90
        }));
        break;
      default:
    }
  };

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  render() {
    return (
      <div
        style={{
          width: this.gameWidth,
          height: this.gameHeight,
          backgroundColor: "lightGrey",
          overflow: "hidden",
          position: "relative"
        }}
      >
        <Frog
          startX={this.frogStartX}
          startY={this.frogStartLane * frogSize}
          x={this.state.frogX}
          y={this.state.frogLane * frogSize}
          dir={this.state.frogDir}
        />
        <GrassLane key={0} />
        {laneTypes.map((laneType, i) => {
          switch (laneType) {
            case "g":
              return <GrassLane key={i + 1} />;
            case "r":
              return <RoadLane key={i + 1} />;
            case "w":
              return <WaterLane key={i + 1} />;
            default:
              throw new Error("bad lane type: " + laneType);
          }
        })}
        <GrassLane key={this.numLanes - 1} />
      </div>
    );
  }
}

class Frog extends React.Component {
  render() {
    let { x, y, startX, startY } = this.props;

    return (
      <Animate
        start={{
          moveX: 0,
          moveY: 0
        }}
        update={{
          moveX: [x - startX],
          moveY: [y - startY],
          timing: {
            delay: 0,
            duration: 80,
            ease: easeLinear
          }
        }}
      >
        {data => (
          <div
            style={{
              transform: `translate(${data.moveX}px, ${data.moveY}px)`,
              position: "absolute",
              left: this.props.startX,
              top: this.props.startY,
              width: frogSize,
              height: frogSize,
              zIndex: 1
            }}
          >
            <img
              src={require("./assets/frog.png")}
              alt="frog"
              style={{
                transform: `rotate(${this.props.dir}deg)`,
                width: frogSize - 6,
                height: frogSize - 6,
                padding: 3
              }}
            />
          </div>
        )}
      </Animate>
    );
  }
}

const Lane = ({ backgroundColor, ...props }) => {
  return (
    <div
      style={{
        height: frogSize,
        width: "100%",
        backgroundColor: backgroundColor
      }}
    ></div>
  );
};

const GrassLane = props => {
  return <Lane backgroundColor="green"></Lane>;
};

const RoadLane = props => {
  return <Lane backgroundColor="grey"></Lane>;
};

const WaterLane = props => {
  return <Lane backgroundColor="blue"></Lane>;
};

export default App;
