export const numLanes = 13;
export const minLaneHeight = 20;
export const maxLaneHeight = 60;
// (approx) number of positions the frog can be in, horizontally
export const minHorizontalFrogPositions = 8;
export const maxHorizontalFrogPositions = 16;
export const minGameWidth = minLaneHeight * minHorizontalFrogPositions;

export const computeGameDimensions = (
  windowWidth: number,
  windowHeight: number
) => {
  if (windowWidth < minGameWidth || windowHeight < minLaneHeight * numLanes) {
    return null;
  }

  // laneHeight determines frogSize, so we don't want lanes to get so wide that
  // the frog can't move very much horizontally.
  let laneHeight = Math.min(
    windowWidth / minHorizontalFrogPositions,
    maxLaneHeight
  );
  // that said, the actual lane height might need to be adjusted smaller still if
  // the screen isn't tall enough to fit the above-determined lanes.
  if (laneHeight * numLanes > windowHeight) {
    laneHeight = Math.floor(windowHeight / numLanes);
  }
  let gameHeight = laneHeight * numLanes;

  // now we have to go back and adjust the game width again, in case laneHeight
  // shrunk to the point the game is now too wide.
  let gameWidth = Math.min(
    windowWidth,
    laneHeight * maxHorizontalFrogPositions
  );

  let lanePadding = Math.max(2, Math.floor(laneHeight / 15));
  let frogSize = laneHeight - lanePadding * 2;

  return { gameWidth, gameHeight, laneHeight, lanePadding, frogSize };
};
