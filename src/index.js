const { min, max } = Math

export default function BucketQueue({
  calls = 100,
  perInterval = 60*1000,
  maxConcurrent = Infinity,
  tickFrequency = 10
} = {}) {

  let queue = []
  let intervalId = null
  let lastNow = 0
  let bucketCount = 0
  let countdown = 0
  let concurrent = 0

  function _tick(elapsed=0) {
    countdown = max(0, countdown - elapsed)

    // reset bucketCount if countdown finishes
    if (countdown <= 0) bucketCount = 0

    // get available
    const concurrentAvailable = maxConcurrent - concurrent
    const callsAvailable = calls - bucketCount
    const available = max(min(callsAvailable, concurrentAvailable, queue.length), 0)

    // if we haven't maxed out
    if (bucketCount < calls && available) {

      queue
        .splice(0, available)
        .forEach((fn) => {
          bucketCount += 1
          concurrent += 1
          fn()
        })

      // reset countdown
      countdown = perInterval
    }
  }

  function _done(cb) {
    return (result) => {
      concurrent = max(0, concurrent - 1)
      cb(result)
    }
  }

  function add(fn, args=[]) {
    return new Promise(( resolve, reject ) => {
      queue.push(() => fn.apply(fn, [].concat(args))
        .then(_done(resolve))
        .catch(_done(reject)))
    })
  }

  function _getElapsed () {
    const now = new Date().getTime()
    const elapsed = now - lastNow
    lastNow = now
    return elapsed
  }

  function start() {
    lastNow = new Date().getTime()
    _tick(0)
    if (!intervalId) intervalId = setInterval(() => {
      _tick(_getElapsed())
    }, tickFrequency)
    return api
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    return api
  }

  function getState(key) {
    const state = {
      concurrent,
      queueCount: queue.length,
      bucketCount,
      waiting: bucketCount >= calls
    }
    return key ? state[key] : state
  }

  const api = Object.freeze({
    getState,
    add,
    start,
    stop,
    _tick // exporting for tests
  })

  return api
}
