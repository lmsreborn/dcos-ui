import { timer } from "rxjs/observable/timer";

import "rxjs/add/operator/delayWhen";
import "rxjs/add/operator/scan";
// import { Observable } from "rxjs/Observable";
// import { Scheduler } from "rxjs/Scheduler";

/* eslint-disable import/prefer-default-export */
/**
 * linearBackoff callback to use with e.g. delayWhen
 *
 * @param  {number} delay
 * @param  {number} [maxRetries=-1]
 * @param  {number} [maxDelay=Number.MAX_SAFE_INTEGER]
 * @param  {Scheduler} [scheduler=null]
 * @return {Observable} notifier obervable
 */
export function linearBackoff(
  delay,
  maxRetries = -1,
  maxDelay = Number.MAX_SAFE_INTEGER,
  scheduler = null
) {
  return errors =>
    errors
      .scan((count, error) => {
        if (maxRetries >= 0 && count >= maxRetries) {
          throw error;
        }

        return count + 1;
      }, 0)
      .delayWhen(val =>
        timer(Math.min(val * delay, maxDelay), null, scheduler)
      );
}
