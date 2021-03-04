const express = require("express");
const cors = require("cors");
const Firestore = require("@google-cloud/firestore");
// TODO remove in favor of just Firestore after learning modules
const admin = require("firebase-admin");


const app = express();

app.use(cors());


// TODO figure out how to share code between frontend and backend
MAX_NAME_LENGTH = 12;
MAP_TYPES = ["classic", "los angeles", "venice", "expert"];

const db = new Firestore({
    projectId: "jwayne-personal",
});

let badWordsFilter;

const createError = function(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Get the top `count` scores for this `mapType` from Firestore.
 */
const getTopScores = async (mapType, count) => {
  const scoresRef = db.collection("scores");

  if (count === undefined) {
    count = 0;
  }

  // Get the top `count` scores.
  let snapshot = await scoresRef
    .where('mapType', '==', mapType)
    .orderBy("finishTimeMs")
    .limit(count)
    .get()

  // Build an array containing these scores.
  // If `thisScoreRef` is specified, check if it's in these scores.
  // TODO handle ties
  const scores = [];
  snapshot.forEach(doc => {
    const score = doc.data();
    scores.push(score);
  })
  return scores;
}

/**
 * Get the top `count` scores for this `mapType` from Firestore, and also get
 * the score and rank of `scoreRef` from Firestore.
 */
const getRankedScores = async (mapType, count, thisScoreRef) => {
  const scoresRef = db.collection("scores");

  // Get the top `count` scores.
  let snapshot = await scoresRef
    .where('mapType', '==', mapType)
    .orderBy("finishTimeMs")
    .limit(count)
    .get()

  // Build an array containing these scores.
  // If `thisScoreRef` is specified, check if it's in these scores.
  // TODO handle ties
  const rankedScores = [];
  let foundThisScore = thisScoreRef ? false : true;
  let rank = 0;
  let lastDoc;
  snapshot.forEach(doc => {
    const score = doc.data();
    if (!foundThisScore && doc.id === thisScoreRef.id) {
      score.isYourScore = true;
      foundThisScore = true;
    }
    score.rank = ++rank;
    rankedScores.push(score);
    lastDoc = doc;
  })


  // If `thisScoreRef` isn't in the above scores, get its rank and add it to
  // the array of scores we return.
  if (!foundThisScore) {
    if (!lastDoc) {
      throw createError(500,
        `Couldn't find newly added score (ID: ${thisScoreRef.id}) in database: database is empty.`)
    }
    const thisScoreDoc = await thisScoreRef.get();
    while (!foundThisScore) {
      snapshot = await scoresRef
        .where('mapType', '==', mapType)
        .orderBy("finishTimeMs")
        .startAfter(lastDoc)
        .endAt(thisScoreDoc)
        .limit(50)
        .get();

      if (snapshot.empty) {
        throw createError(500,
          `Couldn't find newly added score (ID: ${thisScoreRef.id}) in database: iterated through ${rank} entries.`)
      }
      snapshot.forEach(doc => {
        lastDoc = doc;
        rank++;
        if (doc.id === thisScoreRef.id) {
          const score = doc.data();
          score.isYourScore = true;
          score.rank = rank;
          rankedScores.push(score);
          foundThisScore = true;
        }
      })
    }
  }
  return rankedScores;
}


/**
 * Get the high scores for this map type.
 *
 * @param {string} mapType Which map to get scores for
 * @param {number} count How many scores to get
 */
app.get("/scores", async (req, res, next) => {
  const mapType = req.query.mapType;
  if (mapType === undefined) {
    next(createError(400, "Must supply mapType"));
  }

  let count = req.query.count;
  if (count !== undefined) {
    count = +count;
  }

  // Get the high scores.
  getTopScores(mapType, count)
    .then((highScores) => {
      res.json(highScores);
    })
    .catch(next);
});


// TODO where to insert this? should it really be hanging out in the middle like this?
// what if I have more POST routes than just 1?
app.use(express.json());


/**
 * Submit a new score.
 *
 * @param {string} name Player's submitted name
 * @param {string} mapType Which map this score is for
 * @param {number} finishTimeMs Time to finish the game, in millis
 */
app.post("/scores", async (req, res, next) => {
  const reqData = req.body;

  // Clean input
  let name = reqData.name;
  if (name) {
    if (badWordsFilter === undefined) {
      const Filter = require('bad-words');
      badWordsFilter = new Filter();
      badWordsFilter.removeWords('sexy', 'sex');
    }
    name = badWordsFilter.clean(reqData.name);
    if (name.length > MAX_NAME_LENGTH) {
      name = name.substring(0, MAX_NAME_LENGTH);
    }
  }
  const mapType = reqData.mapType;
  if (MAP_TYPES.indexOf(mapType) === -1) {
    next(createError(400, "Invalid mapType: " + mapType));
  }
  const finishTimeMs = +reqData.finishTimeMs;
  if (!finishTimeMs) {
    next(createError(400, "Invalid finishTimeMs: " + finishTimeMs));
  }

  console.log(`Adding new score: {name: '${name}', mapType: '${mapType}', finishTimeMs: ${finishTimeMs}}`);

  // Add this score to the database.
  const scoresRef = db.collection("scores");
  const newScoreRef = await scoresRef.add({
    "name": name,
    "mapType": mapType,
    "finishTimeMs": finishTimeMs,
    "timestamp": admin.firestore.FieldValue.serverTimestamp(),
  })
  console.log("Added new score: " + newScoreRef.id);

  const newScore = await newScoreRef.get();
  res.json(newScore.data());
})


app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({message: err.message});
})


module.exports = {
  app
};
