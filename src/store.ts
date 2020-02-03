import { Reducer } from "redux";
import _ from "lodash";
import { frogSize, gameWidth } from "./constants";
import {
  LaneType,
  LaneObjectState,
  LaneState,
  ReducerState,
  LaneObjectData,
  FrogMoveAction,
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
  let pos = _.random(minGap, maxGap);
  let id = 0;
  while (pos < laneObjectsApproxLoopLength) {
    laneObjects.push({
      startPos: pos,
      id: id++,
      color: _.sample(colors) || "black" // TODO how to handle situations like this?
    });
    pos += length + _.random(minGap, maxGap);
  }
  return laneObjects;
};

/** Initialize a lane for the given type */
const initLane = (laneType: LaneType): LaneState => {
  if (laneType === LaneType.GRASS) {
    return {
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

/* selectors */

export const getLaneObjectPositions = (
  state: ReducerState,
  laneNumber: number
): number[] => {
  let laneState = state.lanes[laneNumber];
  if (laneState.laneType === LaneType.GRASS) {
    return [];
  }
  let laneObjects = laneState.laneObjects;
  let loopLength =
    laneObjects[laneObjects.length - 1].startPos + laneState.length;
  let displacement = laneState.speed * state.time;

  if (laneState.direction < 0) {
    // moving left
    return laneObjects.map(laneObject => {
      return (
        2 * gameWidth - ((laneObject.startPos + displacement) % loopLength)
      );
    });
  } else {
    // moving right
    return laneObjects.map(laneObject => {
      return -gameWidth + ((laneObject.startPos + displacement) % loopLength);
    });
  }
};

export const getLaneObjectData = (
  state: ReducerState,
  laneNumber: number
): LaneObjectData[] => {
  let laneState = state.lanes[laneNumber];
  if (laneState.laneType === LaneType.GRASS) {
    return [];
  }

  let length = laneState.length;
  let objectPositions = getLaneObjectPositions(state, laneNumber);
  return laneState.laneObjects.map((laneObject, i) => ({
    left: objectPositions[i],
    length: length,
    color: laneObject.color,
    id: laneObject.id
  }));
};

const checkIsAlive = (state: ReducerState): boolean => {
  if (!state.isAlive) {
    return false;
  }

  if (state.frog.x < 0 || state.frog.x > gameWidth - frogSize) {
    return false;
  }

  let laneNumber = state.frog.lane;
  let laneState = state.lanes[state.frog.lane];
  if (laneState.laneType === LaneType.GRASS) {
    return true;
  } else {
    let objectPositions = getLaneObjectPositions(state, laneNumber);
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

/* reducers */

const reduceFrogMoveEvent = (
  state: ReducerState,
  action: FrogMoveAction
): ReducerState => {
  if (!state.isAlive) {
    return state;
  }

  // move frog
  let frogState = { ...state.frog };
  let newState = { ...state, frog: frogState };
  switch (action.dir) {
    case "Up":
      if (frogState.lane > 0) {
        frogState.lane--;
      }
      frogState.direction = 0;
      break;
    case "Down":
      if (frogState.lane < state.lanes.length - 1) {
        frogState.lane++;
      }
      frogState.direction = 180;
      break;
    case "Left":
      // If frog oversteps boundary, just coerce to equal boundary
      if (frogState.x - sideStepSize < 0) {
        frogState.x = 0;
      } else {
        frogState.x -= sideStepSize;
      }
      frogState.direction = 270;
      break;
    case "Right":
      // If frog oversteps boundary, just coerce to equal boundary
      if (frogState.x + sideStepSize > gameWidth - frogSize) {
        frogState.x = gameWidth - frogSize;
      } else {
        frogState.x += sideStepSize;
      }
      frogState.direction = 90;
      break;
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
    laneState.laneType === LaneType.WATER &&
    state.isAlive
  ) {
    let newFrogX =
      state.frog.x + laneState.speed * action.tickAmount * laneState.direction;
    // Don't let the frog get off the map
    if (newFrogX < -frogSize / 2) {
      newFrogX = -frogSize / 2;
    } else if (newFrogX > gameWidth - frogSize / 2) {
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
    case ActionType.FROG_MOVE:
      return reduceFrogMoveEvent(state, action);
  }
};
