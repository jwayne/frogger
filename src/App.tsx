import React, { useEffect } from "react";
import { Animate } from "react-move";
import { useSelector, useDispatch } from "react-redux";
import { Swipeable, EventData } from "react-swipeable";
import "./App.css";
import { frogSize, gameWidth } from "./constants";
import { LaneType, ReducerState, ActionType } from "./types";
import { getLaneObjectData, initFrog } from "./store";

export class App extends React.Component {
  componentDidMount() {
    document.title = "Frogger"; // TODO make this work declaratively
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "650px" // TODO fix 100vh for mobile
        }}
      >
        <Game />
      </div>
    );
  }
}

const lanePadding = 3;
const laneHeight = frogSize + lanePadding * 2;
const refreshInterval = 20; // 20ms refresh = 50 fps

const Game: React.FC = props => {
  const frog = useSelector((state: ReducerState) => state.frog);
  const lanes = useSelector((state: ReducerState) => state.lanes);
  const isAlive = useSelector((state: ReducerState) => state.isAlive);

  const dispatch = useDispatch();

  useEffect(() => {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          dispatch({
            type: ActionType.FROG_MOVE,
            dir: e.key.substring(5)
          });
      }
    });
  }, [dispatch]);

  useEffect(() => {
    const tick = setInterval(() => {
      dispatch({ type: ActionType.TICK, tickAmount: refreshInterval });
    }, refreshInterval);
    return () => {
      if (tick !== undefined) {
        clearInterval(tick);
      }
    };
  }, [dispatch]);

  let numLanes = lanes.length;
  let gameHeight = laneHeight * numLanes;
  let initialFrog = initFrog(numLanes);

  return (
    <Swipeable
      onSwiped={(e: EventData) => {
        dispatch({ type: ActionType.FROG_MOVE, key: e.dir });
      }}
    >
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
          x={frog.x}
          y={frog.lane * laneHeight + lanePadding}
          isAlive={isAlive}
          direction={frog.direction}
          startX={initialFrog.x}
          startY={initialFrog.lane * laneHeight + lanePadding}
        />
        {lanes.map((lane, i) => {
          switch (lane.laneType) {
            case LaneType.GRASS:
              return <Lane key={i} color="green" />;
            case LaneType.ROAD:
              return <MovingLane key={i} color="grey" laneNumber={i} />;
            case LaneType.WATER:
              return <MovingLane key={i} color="blue" laneNumber={i} />;
            default:
              throw new Error("shouldn't get here");
          }
        })}
      </div>
    </Swipeable>
  );
};

type FrogProps = {
  x: number;
  y: number;
  direction: number;
  isAlive: boolean;
  startX: number;
  startY: number;
};

const Frog: React.FC<FrogProps> = ({
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

type LaneProps = {
  color: string;
};

const Lane: React.FC<LaneProps> = ({ color, children }) => {
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

type MovingLaneProps = LaneProps & {
  laneNumber: number;
};

const MovingLane: React.FC<MovingLaneProps> = ({ color, laneNumber }) => {
  let laneObjectData = useSelector((state: ReducerState) =>
    getLaneObjectData(state, laneNumber)
  );

  return (
    <Lane color={color}>
      {laneObjectData.map(laneObject => (
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
};

export default App;
