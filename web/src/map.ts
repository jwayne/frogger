import {
  LaneType,
  LaneObjectState,
  LaneState,
  FrogState,
  MapType
} from "./types";
import _ from "lodash";
import { numLanes } from "./dimensions";

export const initFrog = (gameWidth: number, frogSize: number): FrogState => {
  return {
    x: (gameWidth - frogSize) / 2,
    lane: numLanes - 1,
    direction: 0
  };
};

/** Initialize lane objects given the lane's properties */
export const initLaneObjects = (
  length: number,
  minGap: number,
  maxGap: number,
  colors: string[],
  gameWidth: number
): LaneObjectState[] => {
  const laneObjectsApproxLoopLength = 4 * gameWidth;

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
export const initLane = (laneType: LaneType, gameWidth: number): LaneState => {
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
      throw new Error("shouldn't get here: " + laneType);
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
    laneObjects: initLaneObjects(length, minGap, maxGap, colors, gameWidth)
  };
};

export const initLanes = (mapType: MapType, gameWidth: number) => {
  let laneTypes: LaneType[];
  switch (mapType) {
    case "CLASSIC":
      laneTypes = [
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
      break;
    case "LOS ANGELES":
      laneTypes = [
        LaneType.GRASS,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.GRASS
      ];
      break;
    case "VENICE":
      laneTypes = [
        LaneType.GRASS,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.GRASS
      ];
      break;
    case "EXPERT":
      laneTypes = [
        LaneType.GRASS,
        LaneType.WATER,
        LaneType.ROAD,
        LaneType.WATER,
        LaneType.ROAD,
        LaneType.WATER,
        LaneType.WATER,
        LaneType.ROAD,
        LaneType.WATER,
        LaneType.ROAD,
        LaneType.ROAD,
        LaneType.WATER,
        LaneType.GRASS
      ];
      break;
    default:
      throw new Error("Bad map type: " + mapType);
  }
  if (laneTypes.length !== numLanes) {
    throw new Error(
      "Bad number of lanes for " + mapType + ": " + laneTypes.length
    );
  }
  return laneTypes.map(laneNumber => {
    return initLane(laneNumber, gameWidth);
  });
};
