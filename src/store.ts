import { Reducer } from "redux";
import _ from "lodash";
import { frogSize, gameWidth } from "./constants";
import {
  LaneType,
  LaneObjectState,
  LaneState,
  ReducerState,
  MovingLaneState,
  KeyboardEventAction,
  TickEventAction,
  ReducerAction,
  ActionType,
  FrogState
} from "./types";

/* State initializers */

const sideStepSize = frogSize;
const laneTypes: LaneType[] = [
  LaneType.GRASS,
  LaneType.WATER,
  LaneType.WATER,
  LaneType.WATER,
  LaneType.WATER,
  LaneType.WATER,
  LaneType.GRASS,
  LaneType.ROAD,
  LaneType.ROAD,
  LaneType.ROAD,
  LaneType.ROAD,
  LaneType.ROAD,
  LaneType.GRASS
];
const laneObjectsApproxLoopLength = 3 * gameWidth;

/** Initialize lane objects given the lane's properties */
const initLaneObjects = (
  length: number,
  minGap: number,
  maxGap: number,
  colors: string[]
): LaneObjectState[] => {
  let laneObjects = [];
  let x = _.random(minGap, maxGap);
  let id = 0;
  while (x < laneObjectsApproxLoopLength) {
    laneObjects.push({
      x: x,
      id: id++,
      color: _.sample(colors) || "black" // TODO how to handle situations like this?
    });
    x += length + _.random(minGap, maxGap);
  }
  return laneObjects;
};

/** Initialize a lane for the given type */
const initLane = (laneType: LaneType): LaneState => {
  if (laneType === LaneType.GRASS) {
    return {
      tag: "static",
      laneType: LaneType.GRASS
    };
  }

  let secsToCross, speed, direction, length, minGap, maxGap, colors;
  switch (laneType) {
    case LaneType.ROAD:
      secsToCross = _.random(2, 8, true);
      length = secsToCross < 6 ? 60 : 120;
      colors = ["white", "#000", "#333", "red", "beige", "lightBlue"];
      break;
    case LaneType.WATER:
      secsToCross = _.random(5, 8, true);
      length = _.random(120, 240, true);
      colors = ["#654321", "#654321", "#003300"];
      break;
    default:
      throw new Error("shouldn't get here");
  }
  speed = gameWidth / (secsToCross * 1000);
  direction = _.random(0, 1) * 2 - 1;
  minGap = secsToCross < 6 ? 120 : 180;
  maxGap = secsToCross < 6 ? 480 : 240;

  return {
    tag: "moving",
    laneType: laneType,
    speed: speed,
    direction: direction,
    length: length,
    minGap: minGap,
    maxGap: maxGap,
    laneObjects: initLaneObjects(length, minGap, maxGap, colors)
  };
};

export const initFrog = (numLanes: number): FrogState => {
  return {
    x: (gameWidth - frogSize) / 2,
    lane: numLanes - 1,
    direction: 0
  };
};

export const initState = (): ReducerState => {
  let lanes = laneTypes.map(initLane);
  return {
    frog: initFrog(lanes.length),
    lanes: lanes,
    time: 0,
    isAlive: true
  };
};

/* reducers */

export const getCurrentLaneObjectPositions = (
  laneState: MovingLaneState,
  time: number
): number[] => {
  let laneObjects = laneState.laneObjects;
  let loopLength = laneObjects[laneObjects.length - 1].x + laneState.length;
  let displacement = laneState.speed * time;

  if (laneState.direction < 0) {
    // moving left
    return laneObjects.map(laneObject => {
      return 2 * gameWidth - ((laneObject.x + displacement) % loopLength);
    });
  } else {
    // moving right
    return laneObjects.map(laneObject => {
      return -gameWidth + ((laneObject.x + displacement) % loopLength);
    });
  }
};

const checkIsAlive = (state: ReducerState): boolean => {
  if (!state.isAlive) {
    return false;
  }

  if (state.frog.x < 0 || state.frog.x > gameWidth - frogSize) {
    return false;
  }

  let laneState = state.lanes[state.frog.lane];
  if (laneState.tag === "static") {
    return true;
  } else {
    let objectPositions = getCurrentLaneObjectPositions(laneState, state.time);
    let frogPos = state.frog.x;
    let objectLength = laneState.length;

    // iterate through all lane objects in the frog's lane, checking for overlap
    switch (laneState.laneType) {
      case LaneType.ROAD:
        for (let pos of objectPositions) {
          if (frogPos + frogSize > pos && frogPos < pos + objectLength) {
            return false;
          }
        }
        return true;
      case LaneType.WATER:
        for (let pos of objectPositions) {
          if (frogPos + frogSize > pos && frogPos < pos + objectLength) {
            return true;
          }
        }
        return false;
      default:
        throw new Error("shouldn't get here");
    }
  }
};

const reduceKeyboardEvent = (
  state: ReducerState,
  action: KeyboardEventAction
): ReducerState => {
  if (!state.isAlive) {
    return state;
  }

  if (
    action.key !== "ArrowUp" &&
    action.key !== "ArrowDown" &&
    action.key !== "ArrowLeft" &&
    action.key !== "ArrowRight"
  ) {
    return state;
  }

  // move frog
  let frogState = { ...state.frog };
  let newState = { ...state, frog: frogState };
  switch (action.key) {
    case "ArrowUp":
      if (frogState.lane > 0) {
        frogState.lane--;
      }
      frogState.direction = 0;
      break;
    case "ArrowDown":
      if (frogState.lane < state.lanes.length - 1) {
        frogState.lane++;
      }
      frogState.direction = 180;
      break;
    case "ArrowLeft":
      if (frogState.x - sideStepSize < 0) {
        frogState.x = -frogSize / 2;
      } else {
        frogState.x -= sideStepSize;
      }
      frogState.direction = 270;
      break;
    case "ArrowRight":
      if (frogState.x + sideStepSize >= gameWidth - frogSize) {
        frogState.x = gameWidth - frogSize / 2;
      } else {
        frogState.x += sideStepSize;
      }
      frogState.direction = 90;
      break;
    default:
      throw new Error("shouldn't get here");
  }
  // check death
  newState.isAlive = checkIsAlive(newState);
  return newState;
};

const reduceTickEvent = (
  state: ReducerState,
  action: TickEventAction
): ReducerState => {
  let newState = { ...state };

  // advance time
  newState.time = state.time + action.tickAmount;

  // update frog position (if necessary)
  let laneState = state.lanes[state.frog.lane];
  if (
    laneState.tag === "moving" &&
    laneState.laneType === LaneType.WATER &&
    state.isAlive
  ) {
    let newFrogX =
      state.frog.x + laneState.speed * action.tickAmount * laneState.direction;
    if (newFrogX < 0) {
      newFrogX = -frogSize / 2;
    } else if (newFrogX > gameWidth - frogSize) {
      newFrogX = gameWidth - frogSize / 2;
    }
    newState.frog = {
      ...state.frog,
      x: newFrogX
    };
  }
  // check death
  newState.isAlive = checkIsAlive(newState);

  return newState;
};

export const rootReducer: Reducer<ReducerState, ReducerAction> = (
  state: ReducerState | undefined,
  action: ReducerAction
): ReducerState => {
  if (!state) {
    return initState();
  }

  switch (action.type) {
    case ActionType.TICK:
      return reduceTickEvent(state, action);
    case ActionType.KEY_DOWN:
      return reduceKeyboardEvent(state, action);
  }
};
