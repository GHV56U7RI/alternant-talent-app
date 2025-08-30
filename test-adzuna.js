/* eslint-env node */
import { searchAdzuna } from "./adzuna.js";
import logger from "./src/logger.js";

const run = async () => {
  const results = await searchAdzuna({
    appId: process.env.ADZUNA_APP_ID,
    appKey: process.env.ADZUNA_APP_KEY,
    pages: 1
  });
  logger.info("Nb annonces :", results.length);
  logger.info(results.slice(0, 3)); // afficher un échantillon
};

run();

