const levels = ['error','warn','info','debug'];
const level = (typeof globalThis.process !== 'undefined' && globalThis.process.env && globalThis.process.env.LOG_LEVEL) || 'info';
function shouldLog(l){
  return levels.indexOf(l) <= levels.indexOf(level);
}
export default {
  error: (...args) => { if (shouldLog('error')) console.error(...args); },
  warn: (...args) => { if (shouldLog('warn')) console.warn(...args); },
  info: (...args) => { if (shouldLog('info')) console.log(...args); },
  debug: (...args) => { if (shouldLog('debug')) (console.debug || console.log)(...args); }
};
