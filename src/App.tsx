import React, { useEffect, useCallback } from "react";
import { Animate } from "react-move";
import { useSelector, useDispatch } from "react-redux";
import { Swipeable, EventData } from "react-swipeable";
import styled from "styled-components";
import "./App.css";
import {
  LaneType,
  ReducerState,
  ActionType,
  GameStatus,
  RoundStatus
} from "./types";
import { getLaneObjectData } from "./store";
import { initFrog, MapTypes } from "./map";

const refreshInterval = 20; // 20ms refresh = 50 fps
const frogMoveDuration = 65;
const alertDelay = 90;

const App: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = "Frogger"; // TODO make this work declaratively
  }, []);

  useEffect(() => {
    dispatch({
      type: ActionType.SCREEN_RESIZE,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      isMobile: "ontouchstart" in window || navigator.msMaxTouchPoints
    });
  }, [dispatch]);

  let { gameStatus, loadingFailed } = useSelector((state: ReducerState) => {
    return {
      gameStatus: state.gameStatus,
      loadingFailed:
        state.gameStatus === GameStatus.LOADING && state.loadingFailed
    };
  });
  let fontSize = useSelector((state: ReducerState) => {
    if (state.gameStatus === GameStatus.LOADING) {
      return "100%";
    }
    return state.gameSize.frogSize;
  });
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: window.innerHeight,
        overflow: "hidden",
        fontSize: fontSize
      }}
    >
      {(() => {
        switch (gameStatus) {
          case GameStatus.LOADING:
            if (loadingFailed) {
              return <div>Oops! Your screen is too small for this game.</div>;
            } else {
              return "";
            }
          case GameStatus.MAIN_MENU:
            return <MainMenu />;
          case GameStatus.PLAYING:
            return <Game />;
        }
      })()}
    </div>
  );
};

type GameStartButtonProps = {
  mapType: string;
};

const StartButton = styled.div`
  &:hover {
    background-color: #aaa;
    border: 3px solid green;
  }
`;
const GameStartButton: React.FC<GameStartButtonProps> = ({ mapType }) => {
  const dispatch = useDispatch();

  return (
    <StartButton
      style={{
        width: "40%",
        height: "20%",
        border: "3px solid #222",
        cursor: "pointer",
        margin: "0.1em",
        backgroundColor: "limegreen",
        color: "#222",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
      className="start-button"
      onClick={() =>
        dispatch({ type: ActionType.START_GAME, mapType: mapType })
      }
    >
      <div style={{ textAlign: "center" }}>{mapType}</div>
    </StartButton>
  );
};

const MainMenu: React.FC = () => {
  const { gameWidth, gameHeight } = useSelector((state: ReducerState) => {
    if (state.gameStatus !== GameStatus.MAIN_MENU) {
      throw new Error("Bad game status: " + state.gameStatus);
    }
    return state.gameSize;
  });

  let items = [];
  for (let i in MapTypes) {
    items.push(<GameStartButton mapType={MapTypes[i]} key={i} />);
  }

  return (
    <div
      style={{
        width: gameWidth,
        height: gameHeight,
        backgroundColor: "#ccc",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        alignItems: "center",
        alignContent: "center"
      }}
    >
      <div
        style={{
          width: "100%",
          height: "40%",
          fontSize: "220%",
          color: "green",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div>Frogger</div>
      </div>
      {items}
    </div>
  );
};

const Game: React.FC = () => {
  const { gameSize, frog, lanes, roundStatus, readyToAlert } = useSelector(
    (state: ReducerState) => {
      if (state.gameStatus !== GameStatus.PLAYING) {
        throw new Error("Bad game status: " + state.gameStatus);
      }
      return {
        gameSize: state.gameSize,
        frog: state.frog,
        lanes: state.lanes,
        roundStatus: state.roundStatus,
        readyToAlert: state.readyToAlert
      };
    }
  );
  const { gameWidth, gameHeight, laneHeight, lanePadding, frogSize } = gameSize;

  const dispatch = useDispatch();
  const moveFrogOnKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
    },
    [dispatch]
  );

  useEffect(() => {
    document.addEventListener("keydown", moveFrogOnKeyDown);
    return () => {
      document.removeEventListener("keydown", moveFrogOnKeyDown);
    };
  });

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

  useEffect(() => {
    if (
      !readyToAlert &&
      (roundStatus === RoundStatus.DEAD || roundStatus === RoundStatus.WON)
    ) {
      setTimeout(() => {
        dispatch({ type: ActionType.READY_TO_ALERT });
      }, alertDelay);
    }
  }, [readyToAlert, roundStatus, dispatch]);

  let initialFrog = initFrog(gameWidth, frogSize);
  let frogImg;
  if (!readyToAlert) {
    frogImg = (
      <img
        src={require("./assets/frog.png")}
        alt="frog"
        style={{
          transform: `rotate(${frog.direction}deg)`,
          width: frogSize,
          height: frogSize
        }}
      />
    );
  } else if (roundStatus === RoundStatus.DEAD) {
    frogImg = (
      <img
        src={require("./assets/dead.png")}
        alt="dead"
        style={{
          width: frogSize,
          height: frogSize
        }}
      />
    );
  } else if (roundStatus === RoundStatus.WON) {
    frogImg = (
      <img
        src={require("./assets/happy_frog.gif")}
        alt="dead"
        style={{
          width: frogSize,
          height: frogSize
        }}
      />
    );
  } else {
    throw new Error("should not get here");
  }

  return (
    <Swipeable
      onSwiped={(e: EventData) => {
        dispatch({ type: ActionType.FROG_MOVE, dir: e.dir });
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
          startX={initialFrog.x}
          startY={initialFrog.lane * laneHeight + lanePadding}
          frogSize={frogSize}
        >
          {frogImg}
        </Frog>
        {lanes.map((lane, i) => {
          switch (lane.laneType) {
            case LaneType.GRASS:
              return (
                <Lane
                  key={i}
                  laneType={lane.laneType}
                  laneHeight={laneHeight}
                  lanePadding={lanePadding}
                />
              );
            case LaneType.ROAD:
            case LaneType.WATER:
              return (
                <MovingLane
                  key={i}
                  laneType={lane.laneType}
                  laneHeight={laneHeight}
                  lanePadding={lanePadding}
                  laneNumber={i}
                />
              );
            default:
              throw new Error("shouldn't get here");
          }
        })}
        {readyToAlert && roundStatus === RoundStatus.DEAD && (
          <DeadGameOverlay />
        )}
        {readyToAlert && roundStatus === RoundStatus.WON && <WonGameOverlay />}
      </div>
    </Swipeable>
  );
};

type FrogProps = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  frogSize: number;
};

const Frog: React.FC<FrogProps> = ({
  x,
  y,
  startX,
  startY,
  frogSize,
  children
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
        duration: frogMoveDuration
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
          zIndex: 3
        }}
      >
        {children}
      </div>
    )}
  </Animate>
);

type LaneProps = {
  laneType: LaneType;
  laneHeight: number;
  lanePadding: number;
};

const Lane: React.FC<LaneProps> = ({
  laneType,
  laneHeight,
  lanePadding,
  children
}) => {
  let style;
  switch (laneType) {
    case LaneType.GRASS:
      style = { backgroundColor: "green" };
      break;
    case LaneType.ROAD:
      style = { backgroundColor: "gray" };
      break;
    case LaneType.WATER:
      style = {
        backgroundImage: `url(${require("./assets/water.png")})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: `${laneHeight}px ${laneHeight}px`
      };
  }
  return (
    <div
      style={{
        ...style,
        height: laneHeight - lanePadding * 2,
        width: "100%",
        padding: `${lanePadding}px 0`,
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

const MovingLane: React.FC<MovingLaneProps> = ({ laneNumber, ...props }) => {
  const { laneHeight, lanePadding } = props;
  let laneObjectData = useSelector((state: ReducerState) =>
    getLaneObjectData(state, laneNumber)
  );

  return (
    <Lane {...props}>
      {laneObjectData.map(laneObject => (
        <div
          style={{
            position: "absolute",
            left: laneObject.left,
            width: laneObject.length,
            height: laneHeight - lanePadding * 2,
            backgroundColor: laneObject.color,
            zIndex: 1
          }}
          key={laneObject.id}
        ></div>
      ))}
    </Lane>
  );
};

const DeadGameOverlay: React.FC = () => {
  const { isMobile, mapType } = useSelector((state: ReducerState) => {
    if (state.gameStatus !== GameStatus.PLAYING) {
      throw new Error("Bad game status: " + state.gameStatus);
    }
    return { isMobile: state.gameSize.isMobile, mapType: state.mapType };
  });
  const dispatch = useDispatch();

  const onKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        dispatch({ type: ActionType.RETURN_TO_MAIN_MENU });
      } else {
        dispatch({ type: ActionType.START_GAME, mapType: mapType });
      }
    },
    [mapType, dispatch]
  );
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  });

  if (isMobile) {
    return (
      <Swipeable
        onSwiped={(e: EventData) => {
            dispatch({ type: ActionType.RETURN_TO_MAIN_MENU });
        }}
      >
        <GameOverlayDiv
          onClick={(event: React.MouseEvent) => {
            dispatch({ type: ActionType.START_GAME, mapType: mapType });
          }}
        >
          <div style={{ textAlign: "center", width: "100%", fontSize: "200%" }}>
            YOU&nbsp;&nbsp;DIED
          </div>
          <div style={{ textAlign: "center", width: "100%" }}>
            [Tap] to restart
            <br />
            [Swipe] for main menu
          </div>
        </GameOverlayDiv>
      </Swipeable>
    );
  } else {
    return (
      <GameOverlayDiv>
        <div style={{ textAlign: "center", width: "100%", fontSize: "200%" }}>
          YOU&nbsp;&nbsp;DIED
        </div>
        <div style={{ textAlign: "center", width: "100%" }}>
          Press any key to restart
          <br />
          [esc] for main menu
        </div>
      </GameOverlayDiv>
    );
  }
};

const WonGameOverlay: React.FC = () => {
  const isMobile = useSelector((state: ReducerState) => {
    if (state.gameStatus !== GameStatus.PLAYING) {
      throw new Error("Bad game status: " + state.gameStatus);
    }
    return state.gameSize.isMobile;
  });
  const dispatch = useDispatch();

  const onKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      dispatch({ type: ActionType.RETURN_TO_MAIN_MENU });
    },
    [dispatch]
  );
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  });

  if (isMobile) {
    return (
      <GameOverlayDiv
        onClick={(event: React.MouseEvent) => {
          dispatch({ type: ActionType.RETURN_TO_MAIN_MENU });
        }}
      >
        <div style={{ textAlign: "center", width: "100%", fontSize: "200%" }}>
          YOU&nbsp;&nbsp;WON
        </div>
        <div style={{ textAlign: "center", width: "100%" }}>
          [Tap] for main menu
        </div>
      </GameOverlayDiv>
    );
  } else {
    return (
      <GameOverlayDiv>
        <div style={{ textAlign: "center", width: "100%", fontSize: "200%" }}>
          YOU&nbsp;&nbsp;WON
        </div>
        <div style={{ textAlign: "center", width: "100%" }}>
          [space] for main menu
        </div>
      </GameOverlayDiv>
    );
  }
};

type GameOverlayDivProps = {
  onClick?: (event: React.MouseEvent) => void;
};

const GameOverlayDiv: React.FC<GameOverlayDivProps> = ({
  onClick,
  children
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        opacity: "80%",
        backgroundColor: "#aaa",
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center"
      }}
    >
      {children}
    </div>
  );
};

export default App;
