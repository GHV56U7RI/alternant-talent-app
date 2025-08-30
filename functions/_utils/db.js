let _db;
export function initDB(env){
  _db=env.DB;
  return _db;
}
export function getDB(env){
  return _db||initDB(env);
}
