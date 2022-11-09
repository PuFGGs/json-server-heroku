const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
var db = router.db.chain()

server.use(middlewares)

function IsAuthorised(username, password) {
  var auth = db.get('users').find({ username: username, password: password }).value()
  if (!auth) return false

  return true
}

function calculateDetails(detail, rater, positive) {
  var count = detail.length;
  var filter = detail.filter(x => x[rater] === positive)
  var filterCount = filter.length;
  var rate = ((filterCount / count) * 100) || 0;

  return { count: count, rate: rate, extra_count: filterCount }
}

server.get('/users', (req, res) => {
  var user = db.get('users').find({ username: req.query.username, password: req.query.password }).value() || res.jsonp(null);
  res.jsonp(user);
})

server.get('/users/*', (req, res) => {
  res.sendStatus(401)
})

server.get('/dasboard-details', (req, res) => {
  if (!IsAuthorised(req.query.username, req.query.password)) res.sendStatus(401)
  var data = {
    "cases": { count: 0, rate: 0, extra_count: 0 },
    "warrants": { count: 0, rate: 0, extra_count: 0 },
    "duty": { count: 0, rate: 0, extra_count: 0 },
    "supervisors": { count: 0, rate: 0, extra_count: 0 },
    "lastCrimes": {}
  };
  var cases = db.get('cases').value()
  var warrants = db.get('warrants').value()
  var duty = db.get('users').value()
  var supervisors = duty.filter(user => user.rank >= 6)
  var lastCases = cases.filter((crime) => crime.id >= cases.length - 10)

  data['cases'] = calculateDetails(cases, "isSucsessful", 1)
  data['warrants'] = calculateDetails(warrants, "felony", 1)
  data['duty'] = calculateDetails(duty, "isActive", 1)
  data['supervisors'] = calculateDetails(supervisors, "isActive", 1)
  data['lastCrimes'] = lastCases;
  res.jsonp(data);

})



server.use(router)
server.listen(3000, () => {
  console.log('JSON Server is running')
})