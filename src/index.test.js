const test = require('ava')
const defer = require('promise-defer')
const BucketQueue = require('./')


const makeCompareState = (q, equal) => (want, message='same state') => {
  const got = q.getState()
  const desired = Object.assign({}, got, want)
  equal(got, desired, message)
}

test('should maintain proper state', async (t) => {
  const q = BucketQueue({
    calls: 1,
    perInterval: 150
  })

  const compareState = makeCompareState(q, (got, want, message) => {
    t.deepEqual(got, want, message)
  })

  compareState({
    waiting: false,
    bucketCount: 0,
    queueCount: 0,
    concurrent: 0
  }, 'initialized queue')

  const d = defer()
  const value = 'cat'
  const p = q.add(() => d.promise)

  compareState({
    waiting: false,
    bucketCount: 0,
    queueCount: 1,
    concurrent: 0
  }, 'added promise returning function to the queue')

  // start
  q._tick(0)

  compareState({
    waiting: true,
    bucketCount: 1,
    queueCount: 0,
    concurrent: 1
  }, 'function popped off the queue and called')

  d.resolve(value)

  const result = await p

  t.is(result, value, `promise resolve value should be: ${value}`)

  compareState({
    waiting: true,
    bucketCount: 1,
    queueCount: 0,
    concurrent: 0
  }, 'promise resolved')

  q._tick(50)

  compareState({
    waiting: true,
    bucketCount: 1,
    queueCount: 0,
    concurrent: 0
  }, 'countdown is at 150ms')

  q._tick(150)

  compareState({
    waiting: false,
    bucketCount: 0,
    queueCount: 0,
    concurrent: 0
  }, 'countdown is at 0ms and bucketCount is reset')
})

test('should throttle calls', async (t) => {
  const q = BucketQueue({
    calls: 2,
    perInterval: 200,
  })

  const compareState = makeCompareState(q, (got, want, message) => {
    t.deepEqual(got, want, message)
  })

  compareState({
    waiting: false,
    bucketCount: 0,
    queueCount: 0,
    concurrent: 0
  }, 'initialized queue')

  const d1 = defer()
  const d2 = defer()
  const d3 = defer()
  const p1 = q.add(() => d1.promise)
  const p2 = q.add(() => d2.promise)
  const p3 = q.add(() => d3.promise)

  compareState({
    waiting: false,
    bucketCount: 0,
    queueCount: 3,
    concurrent: 0
  }, 'added 3 promise returning fuctions to queue')

  // start
  q._tick(0)

  compareState({
    waiting: true,
    bucketCount: 2,
    queueCount: 1,
    concurrent: 2
  }, 'max functions poped off the queue and called')

  q._tick(50)

  compareState({
    waiting: true,
    bucketCount: 2,
    queueCount: 1,
    concurrent: 2
  }, 'countdown is at 150ms')

  const value1 = 'cat'
  d1.resolve(value1)
  const result1 = await p1

  t.is(result1, value1, `promise1 resolve value should be: ${value1}`)

  compareState({
    waiting: true,
    bucketCount: 2,
    queueCount: 1,
    concurrent: 1
  }, 'promise 1 resolves')

  q._tick(50)

  compareState({
    waiting: true,
    bucketCount: 2,
    queueCount: 1,
    concurrent: 1
  }, 'countdown is at 100ms')

  const value2 = 'mouse'
  d2.resolve(value2)
  const result2 = await p2
  t.is(result2, value2, `promise2 resolve value should be: ${value2}`)

  compareState({
    waiting: true,
    bucketCount: 2,
    queueCount: 1,
    concurrent: 0
  }, 'promise 2 resolves')

  q._tick(50)

  compareState({
    waiting: true,
    bucketCount: 2,
    queueCount: 1,
    concurrent: 0
  }, 'countdown is at 50ms')

  q._tick(50)

  compareState({
    waiting: false,
    bucketCount: 1,
    queueCount: 0,
    concurrent: 1
  }, 'countdown finished and function3 popped off the queue and called')

  const value3 = 'cheese'
  d3.resolve(value3)
  const result3 = await p3
  t.is(result3, value3, `promise3 resolve value should be: ${value3}`)

  compareState({
    waiting: false,
    bucketCount: 1,
    queueCount: 0,
    concurrent: 0
  }, 'promise 3 resolves')

  q._tick(50)

  compareState({
    waiting: false,
    bucketCount: 1,
    queueCount: 0,
    concurrent: 0
  }, 'countdown is at 150ms')

  q._tick(150)

  compareState({
    waiting: false,
    bucketCount: 0,
    queueCount: 0,
    concurrent: 0
  }, 'countdown is at 0ms and bucketCount is reset')
})

