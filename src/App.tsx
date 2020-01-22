import React, { FunctionComponent } from "react";
import { Animate } from "react-move";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { Swipeable, EventData } from "react-swipeable";
import "./App.css";
import { frogSize, gameWidth } from "./constants";
import { LaneType, ReducerState, ActionType, ReducerAction } from "./types";
import { getCurrentLaneObjectPositions, initFrog } from "./store";

export class App extends React.Component {
  render() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "700px" // TODO fix 100vh for mobile
        }}
      >
        <GameWithRedux />
      </div>
    );
  }
}

const lanePadding = 3;
const laneHeight = frogSize + lanePadding * 2;
const refreshInterval = 20; // 20ms refresh = 50 fps

interface GameProps {
  frog: {
    /** Horizontal position of frog as # pixels to the frog's left boundary */
    x: number;
    /** Vertical position of frog in as lane number, from top (0) to bottom */
    lane: number;
    /** Direction frog is facing, in css degrees */
    direction: number;
  };
  lanes: {
    laneType: LaneType;
    laneObjects?: {
      left: number;
      length: number;
      color: string;
      id: number;
    }[];
  }[];
  /** Number of millis that have passed since game start. */
  time: number;
  /** Whether the frog is still alive. */
  isAlive: boolean;
  onKeyDown: (e: KeyboardEvent) => void;
  onTick: () => void;
  onSwiped: (e: EventData) => void;
}

class Game extends React.Component<GameProps, {}> {
  private tick: undefined | ReturnType<typeof setTimeout>;

  componentDidMount() {
    document.addEventListener("keydown", this.props.onKeyDown);
    this.tick = setInterval(this.props.onTick, refreshInterval);
  }

  componentWillUnmount() {
    if (this.tick !== undefined) {
      clearInterval(this.tick);
    }
  }

  render() {
    let numLanes = this.props.lanes.length;
    let gameHeight = laneHeight * numLanes;
    let initialFrog = initFrog(numLanes);

    return (
      <Swipeable onSwiped={this.props.onSwiped}>
        <div
          style={{
            width: gameWidth,
            height: gameHeight,
            backgroundColor: "lightGrey",
            overflow: "hidden",
            position: "relative"
          }}
          onMouseDown={e => {
            e.preventDefault();
          }}
        >
          <Frog
            x={this.props.frog.x}
            y={this.props.frog.lane * laneHeight + lanePadding}
            isAlive={this.props.isAlive}
            direction={this.props.frog.direction}
            startX={initialFrog.x}
            startY={initialFrog.lane * laneHeight + lanePadding}
          />
          {this.props.lanes.map((lane, i) => {
            switch (lane.laneType) {
              case LaneType.GRASS:
                return <Lane key={i + 1} color="green" />;
              case LaneType.ROAD:
                if (lane.laneObjects === undefined) throw new Error("asdf");
                return (
                  <MovingLane
                    key={i + 1}
                    color="grey"
                    laneObjects={lane.laneObjects}
                  />
                );
              case LaneType.WATER:
                if (lane.laneObjects === undefined) throw new Error("asdf");
                return (
                  <MovingLane
                    key={i + 1}
                    color="blue"
                    laneObjects={lane.laneObjects}
                  />
                );
              default:
                throw new Error("shouldn't get here");
            }
          })}
        </div>
      </Swipeable>
    );
  }
}

const mapStateToProps = (state: ReducerState) => ({
  frog: {
    x: state.frog.x,
    lane: state.frog.lane,
    direction: state.frog.direction
  },
  lanes: state.lanes.map(laneState => {
    if (laneState.tag === "static") {
      return {
        laneType: laneState.laneType
      };
    } else {
      let objectPositions = getCurrentLaneObjectPositions(
        laneState,
        state.time
      );
      return {
        laneType: laneState.laneType,
        laneObjects: laneState.laneObjects.map((laneObject, i) => ({
          left: objectPositions[i],
          length: laneState.length,
          color: laneObject.color,
          id: laneObject.id
        }))
      };
    }
  }),
  time: state.time,
  isAlive: state.isAlive
});

const mapDispatchToProps = (dispatch: Dispatch<ReducerAction>) => ({
  onKeyDown: (e: KeyboardEvent) => {
    dispatch({ type: ActionType.KEY_DOWN, key: e.key });
  },
  onTick: () => {
    dispatch({ type: ActionType.TICK, tickAmount: refreshInterval });
  },
  onSwiped: (e: EventData) => {
    dispatch({ type: ActionType.KEY_DOWN, key: "Arrow" + e.dir });
  }
});

const GameWithRedux = connect(mapStateToProps, mapDispatchToProps)(Game);

interface FrogProps {
  x: number;
  y: number;
  direction: number;
  isAlive: boolean;
  startX: number;
  startY: number;
}

const Frog: FunctionComponent<FrogProps> = ({
  x,
  y,
  direction,
  isAlive,
  startX,
  startY
}) => (
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
          left: startX,
          top: startY,
          width: frogSize,
          height: frogSize,
          zIndex: 2
        }}
      >
        <img
          src={require("./assets/frog.png")}
          alt="frog"
          style={{
            transform: `rotate(${direction}deg)`,
            width: frogSize,
            height: frogSize
          }}
        />
        {isAlive || (
          <img
            src={require("./assets/dead2.png")}
            alt="dead"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: frogSize,
              height: frogSize,
              opacity: data.opacity
            }}
          />
        )}
      </div>
    )}
  </Animate>
);

interface LaneProps {
  color: string;
}

const Lane: FunctionComponent<LaneProps> = ({ color, children }) => {
  return (
    <div
      style={{
        height: laneHeight - 2 * lanePadding,
        width: "100%",
        padding: `${lanePadding}px 0`,
        backgroundColor: color,
        overflow: "hidden",
        position: "relative"
      }}
    >
      {children}
    </div>
  );
};

interface MovingLaneProps {
  color: string;
  laneObjects: {
    left: number;
    length: number;
    color: string;
    id: number;
  }[];
}

const MovingLane: FunctionComponent<MovingLaneProps> = ({
  color,
  laneObjects
}) => (
  <Lane color={color}>
    {laneObjects.map(laneObject => (
      <div
        style={{
          position: "absolute",
          left: laneObject.left,
          width: laneObject.length,
          height: frogSize - lanePadding * 2,
          backgroundColor: laneObject.color,
          zIndex: 1
        }}
        key={laneObject.id}
      ></div>
    ))}
  </Lane>
);

export default App;
