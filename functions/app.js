const express = require("express");
const Firestore = require("@google-cloud/firestore");
// TODO fix after learning modules
const admin = require("firebase-admin");

const app = express();
const db = new Firestore({
    projectId: "jwayne-personal",
});


const createError = function(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const DEFAULT_NUM_HIGH_SCORES = 10;


const getRankedScores = async (mapType, count, thisScoreRef) => {
  const scoresRef = db.collection("scores");

  // Get the top `count` scores.
  let snapshot = await scoresRef
    .where('mapType', '==', mapType)
    .orderBy("finishTimeMs")
    .limit(count)
    .get()

  // Build an array containing these scores, adding their rank as we go along.
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
 * @param {number} count How many scores to get (defaults to 10)
 */
app.get("/scores", async (req, res, next) => {
  const mapType = req.query.mapType;
  if (mapType === undefined) {
    next(createError(400, "Must supply mapType"));
  }

  const count = req.query.count || DEFAULT_NUM_HIGH_SCORES;
  if (count > 25) {
    next(createError(400, "Count too high, cannot exceed 25: " + count));
  }

  // Get the higih scores.
  getRankedScores(mapType, count)
    .then((highScores) => {
      res.json(highScores);
    })
    .catch(next);
});


// TODO where to insert this? should it really be hanging out in the middle like this?
app.use(express.json());


/**
 * Submit a new score.
 *
 * Get the high scores for this map type, along with the ranking of this new
 * score.
 *
 * @param {string} name Player's submitted name
 * @param {string} mapType Which map this score is for
 * @param {number} finishTimeMs Time to finish the game, in millis
 */
app.post("/scores", async (req, res, next) => {
  const newScore = req.body;
  console.log("Adding new score: " + JSON.stringify(newScore));

  // Add this score to the database.
  const scoresRef = db.collection("scores");
  const newScoreRef = await scoresRef.add({
    "name": newScore.name,
    "mapType": newScore.mapType,
    "finishTimeMs": newScore.finishTimeMs,
    "timestamp": admin.firestore.FieldValue.serverTimestamp(),
  })
  console.log("Added new score: " + newScoreRef.id);

  // Get the high scores, along with the ranking of this new score.
  getRankedScores(newScore.mapType, DEFAULT_NUM_HIGH_SCORES, newScoreRef)
    .then((rankedScores) => {
      res.json(rankedScores);
    })
    .catch(next);
})


app.use((err, req, res, next) => {
  res.status(err.status).json({message: err.message});
})


module.exports = {
  app
};
