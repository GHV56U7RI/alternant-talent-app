import { searchAdzuna } from "./adzuna.js";

const run = async () => {
  const results = await searchAdzuna({
    appId: process.env.ADZUNA_APP_ID,
    appKey: process.env.ADZUNA_APP_KEY,
    pages: 1
  });
  console.log("Nb annonces :", results.length);
  console.log(results.slice(0, 3)); // afficher un échantillon
};

run();

