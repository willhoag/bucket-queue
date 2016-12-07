import BucketQueue from '../dist/'

q = BucketQueue({
  calls: 6,
  perInterval: 60 * 1000,
  maxConcurrent: 4,
  tickFrequency: 100
}).start()

userIds.length
// 40

const users = userIds.map((id) => {
  return q.add(fetch, `/user/${id}`)
    .then((res) => res.json())
    .then((user) => console.log(user.name))
})

q.getState()
// {
//   concurrent: 6,
//   bucketCount: 6,
//   queueCount: 34,
//   waiting: true
// }

q.getState('waiting')
// true

q.stop()
