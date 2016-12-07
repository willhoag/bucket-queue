# bucket-queue
A queue with leaky bucket logic made for promises


[![Build Status](https://travis-ci.org/willhoag/bucket-queue.svg?branch=master)](https://travis-ci.org/willhoag/bucket-queue)
[![npm version](https://badge.fury.io/js/bucket-queue.svg)](http://badge.fury.io/js/bucket-queue)

If you use any of my packages, please star them on github. It’s a great way of getting feedback and gives me the kick to put more time into their development. If you encounter any bugs or have feature requests, just open an issue report on Github.

Follow me on Twitter [@devhoag](http://twitter.com/devhoag)

## Description
A simple queue for built for promises and throttling calls. It's great for
making multiple requests to an external api that likely has some kind of rate
limiting like Shopify or Github. This is designed to fit a leaky bucket strategy
of rate limiting, but can fit many different throttling scenarios. Either way,
it's made to be simple and easy to use.

## Example
```js
import BucketQueue from 'bucket-queue'

// initialize
q = BucketQueue({
  calls: 6,
  perInterval: 60 * 1000,
  maxConcurrent: 4,
  tickFrequency: 100
}).start()

// execute a bunch of promises
userIds.length // 40
const users = userIds.map((id) => {
  return q.add(fetch, `/user/${id}`)
    .then((res) => res.json())
    .then((user) => console.log(user.name))
})

// check state
q.getState()
// {
//   concurrent: 6,
//   bucketCount: 6,
//   queueCount: 34,
//   waiting: true
// }

// or just one
q.getState('waiting')
// true

// stop running
q.stop()
```

## Usage
### instantiate queue
```js
const q = BucketQueue(options)
```

### options
- `calls:int (default: 100)` - Max number of calls per interval
- `perInterval:int (default: 60 * 1000)` - Time window (in ms) for max calls to be made
- `maxConcurrent:int (default: Infinity)` - Max number of concurrent promises to be running at one time
- `tickFrequency:int (default: 10)` - How often (in ms) to update state

### using instance
- `q.add(fn -> promise, [args]) -> Promise` - Takes a function that returns a promise and an option set of args to call it with
- `q.getState([key: String]) -> Object / [String/int]` - Returns a object with current state. An optional key will return that particular state
- `q.start() -> q` - Starts the queue running at the specified tickFrequency or the default
- `q.stop() -> q` - Stops the queue running

### the state object from `q.getState()`
- `concurrent` - How many promises are running at the current moment
- `bucketCount` - How many promises have started within the current window
- `queueCount` - How many promises are left on the queue
- `waiting` - whether or now the queue is waiting for the bucket to drain

## Installation
Download node at [nodejs.org](http://nodejs.org) and install it, if you haven't already.


```bash
npm install bucket-queue --save
```

## License
ISC
