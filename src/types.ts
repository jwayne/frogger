/* redux states */

export type FrogState = {
  /** Horizontal position of frog as # pixels to the frog's left boundary */
  x: number;
  /** Vertical position of frog in as lane number, from top (0) to bottom */
  lane: number;
  /** Direction frog is facing, in css degrees */
  direction: number;
};

export enum LaneType {
  GRASS,
  ROAD,
  WATER
}

export type StaticLaneState = {
  tag: "static";
  laneType: LaneType;
};

export type LaneObjectState = {
  /** Left coordinate of object */
  x: number;
  /** Id of object, for referencing */
  id: number;
  /** Color of object */
  color: string;
};

export type MovingLaneState = {
  tag: "moving";
  laneType: LaneType;

  /** speed of objects in lane, in num pixels to move per ms */
  speed: number;
  /** direction of objects in lane. -1 = left, 1 = right */
  direction: number;
  /** length of objects in lane, in pixels */
  length: number;
  /** min gap between objects in lane, in pixels */
  minGap: number;
  /** max gap between objects in lane, in pixels */
  maxGap: number;

  laneObjects: LaneObjectState[];
};

export type LaneState = StaticLaneState | MovingLaneState;

export type ReducerState = {
  frog: FrogState;
  lanes: LaneState[];
  /** Number of millis that have passed since game start. */
  time: number;
  /** Whether the frog is still alive. */
  isAlive: boolean;
};

/* redux actions */

export enum ActionType {
  KEY_DOWN,
  TICK
}

export type KeyboardEventAction = {
  type: ActionType.KEY_DOWN;
  key: string;
};

export type TickEventAction = {
  type: ActionType.TICK;
  tickAmount: number;
};

export type ReducerAction = KeyboardEventAction | TickEventAction;
