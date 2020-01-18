import React, { FunctionComponent } from "react";
import { Animate } from "react-move";
import _ from "lodash";
import "./App.css";

export class App extends React.Component {
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

enum LaneType {
  Grass,
  Road,
  Water
}
const laneTypes: LaneType[] = [
  LaneType.Water,
  LaneType.Water,
  LaneType.Water,
  LaneType.Water,
  LaneType.Water,
  LaneType.Grass,
  LaneType.Road,
  LaneType.Road,
  LaneType.Road,
  LaneType.Road,
  LaneType.Road
];
const frogSize = 60;
const sideStepSize = frogSize;
const objectPadding = 3;
const gameWidth = 800;
const refreshInterval = 20; // 20ms refresh = 50 fps

interface GameState {
  frogX: number;
  frogLane: number;
  frogDir: number;
  time: number;
}

class Game extends React.Component<{}, GameState> {
  numLanes = laneTypes.length + 2;
  gameHeight = frogSize * this.numLanes;
  frogStartX = (gameWidth - frogSize) / 2;
  frogStartLane = this.numLanes - 1;

  private tick: NodeJS.Timeout | undefined;

  constructor(props: {}) {
    super(props);

    this.state = {
      frogX: this.frogStartX,
      frogLane: this.frogStartLane,
      frogDir: 0,
      time: 0
    };
  }

  handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this.setState((state: GameState) => ({
          frogLane: state.frogLane - 1,
          frogDir: 0
        }));
        break;
      case "ArrowDown":
        this.setState((state: GameState) => ({
          frogLane: state.frogLane + 1,
          frogDir: 180
        }));
        break;
      case "ArrowLeft":
        this.setState((state: GameState) => ({
          frogX: state.frogX - sideStepSize,
          frogDir: 270
        }));
        break;
      case "ArrowRight":
        this.setState((state: GameState) => ({
          frogX: state.frogX + sideStepSize,
          frogDir: 90
        }));
        break;
      default:
    }
  };

  handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  handleRefresh = () => {
    this.setState({ time: this.state.time + refreshInterval });
  };

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
    this.tick = setInterval(this.handleRefresh, refreshInterval);
  }

  componentWillUnmount() {
    // TODO not sure how to make the types here work..
    //clearInterval(this.tick)
  }

  render() {
    return (
      <div
        onMouseDown={this.handleMouseDown}
        style={{
          width: gameWidth,
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
            case LaneType.Grass:
              return <GrassLane key={i + 1} />;
            case LaneType.Road:
              return <RoadLane key={i + 1} time={this.state.time} />;
            case LaneType.Water:
              return <WaterLane key={i + 1} time={this.state.time} />;
            default:
              throw new Error("shouldn't get here");
          }
        })}
        <GrassLane key={this.numLanes - 1} />
      </div>
    );
  }
}

interface FrogProps {
  x: number;
  y: number;
  startX: number;
  startY: number;
  dir: number;
}

class Frog extends React.Component<FrogProps, {}> {
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
            duration: 75
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
              zIndex: 2
            }}
          >
            <img
              src={require("./assets/frog.png")}
              alt="frog"
              style={{
                transform: `rotate(${this.props.dir}deg)`,
                width: frogSize - objectPadding * 2,
                height: frogSize - objectPadding * 2,
                padding: objectPadding
              }}
            />
          </div>
        )}
      </Animate>
    );
  }
}

interface LaneProps {
  /** color of the lane */
  color: string;
}

const Lane: FunctionComponent<LaneProps> = ({ color, ...props }) => {
  return (
    <div
      style={{
        height: frogSize,
        width: "100%",
        backgroundColor: color,
        overflow: "hidden",
        position: "relative"
      }}
    >
      {props.children}
    </div>
  );
};

const GrassLane = () => {
  return <Lane color="green"></Lane>;
};

interface LaneObject {
  x: number;
  index: number;
  color: string | undefined; // TODO how to avoid undefined?
}

interface MovingLaneProps {
  /** current global time, in ms */
  time: number;
}

const carColors = ["white", "#000", "#333", "red", "beige", "lightBlue"];

class RoadLane extends React.Component<MovingLaneProps, {}> {
  /** speed of objects in lane, in num seconds to cross the screen */
  secsToCross = _.random(2, 8, true);
  /** speed of objects in lane, in num pixels to move per ms */
  speed = gameWidth / (this.secsToCross * 1000);
  /** direction of objects in lane */
  direction = _.random(0, 1);
  /** length of objects in lane, in pixels */
  length = this.secsToCross < 6 ? 60 : 120;
  /** min gap between objects in lane, in pixels */
  minGap = this.secsToCross < 6 ? 120 : 180;
  /** max gap between objects in lane, in pixels */
  maxGap = this.secsToCross < 6 ? 480 : 240;

  laneColor = "grey";

  laneObjects: LaneObject[];
  loopLength: number;

  constructor(props: MovingLaneProps) {
    super(props);
    this.laneObjects = this.generateLaneObjects();
    this.loopLength =
      this.laneObjects[this.laneObjects.length - 1].x + this.length;
  }

  /** generate a list of original object locations at least as long as twice the viewport */
  private generateLaneObjects(): LaneObject[] {
    let positions: LaneObject[] = [];
    let maxX = 2 * gameWidth;
    let prevX = -this.length;
    let prevIndex = -1;
    while (prevX < maxX) {
      prevX += this.length + _.random(this.minGap, this.maxGap);
      positions.push({
        x: prevX,
        index: ++prevIndex,
        color: this.generateLaneObjectColor()
      });
    }
    return positions;
  }

  generateLaneObjectColor(): string | undefined {
    return _.sample(carColors);
  }

  getCurrentPosition(x: number, displacement: number): number {
    let afterDisplacement = (x - displacement) % this.loopLength;
    if (afterDisplacement < 0) {
      afterDisplacement = afterDisplacement + this.loopLength;
    }
    if (this.direction) {
      // moving left
      return afterDisplacement - this.loopLength / 4;
    } else {
      // moving right
      return gameWidth - afterDisplacement + this.loopLength / 4;
    }
  }

  render() {
    let displacement = this.speed * this.props.time;

    return (
      <Lane color={this.laneColor}>
        {this.laneObjects.map(laneObject => {
          return (
            <div
              style={{
                position: "absolute",
                left: this.getCurrentPosition(laneObject.x, displacement),
                width: this.length,
                height: frogSize - objectPadding * 2,
                marginTop: objectPadding,
                marginBottom: objectPadding,
                backgroundColor: laneObject.color,
                zIndex: 1
              }}
              key={laneObject.index}
            ></div>
          );
        })}
      </Lane>
    );
  }
}

const logColors = ["#654321", "#654321", "#003300"];

class WaterLane extends RoadLane {
  secsToCross = _.random(5, 8, true);
  length = _.random(120, 240, true);

  laneColor = "blue";

  generateLaneObjectColor(): string | undefined {
    return _.sample(logColors);
  }
}

export default App;
