const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
var db = router.db.chain()

server.use(middlewares)
server.use((req, res, next) => {
  if (IsAuthorised(req.query.username, req.query.password)) {
    next()
  } else {
    res.sendStatus(401)
  }
})

function IsAuthorised(username, password) {
  var auth = db.get('users').find({ username: username, password: password }).value()
  if (!auth) return false

  return true
}
function calculateDetails(detail, rater, positive) {
  var count = detail.length;
  var filter = detail.filter(x => x[rater] === positive)
  var filterCount = filter.length;
  var rate = (((filterCount / count) * 100)).toFixed(2) || 0;

  return { count: count, rate: rate, extra_count: filterCount }
}
function calculateCases(cases) {
  var res = []
  cases.forEach($case => {
    res.push(calculateCase($case))
  });

  return res
}
function calculateCase(crime) {
  var res = { writer: "", punishment: "", isSucsessful: "" }
  const writerData = getUserDataByID(crime.writer, 'users')
  res.writer = writerData.fname + " " + writerData.lname

  const punishment = crime.punishment;
  if (punishment.jail > 0) res.punishment += punishment["jail"] + " months of jail "
  if (punishment.comm > 0) res.punishment += punishment["comm"] + " days of community service "
  if (punishment.fine > 0) res.punishment += "$" + punishment["fine"] + " of fine "

  res.isSucsessful = crime.isSucsessful === 1 ? "Yes" : "No"

  res.id = crime.id
  res["crime"] = crime["crime"]
  res.notes = crime.notes

  return res
}

function formatUserIDs(data, id) {
  var res = []
  data.forEach(j => {
    res.push(formatUserID(j, id))
  });

  return res
}

function formatUserID(data, id) {
  var res = Object.assign({}, data);

  const userData = getUserDataByID(data[id], "criminals")

  res[id] = userData.fname + " " + userData.lname

  return res
}

function getUserDataByID(id, type) {
  const userData = db.get(type).find({ id: id }).value()

  return userData
}
server.get('/users', (req, res) => {
  var user = db.get('users').find({ username: req.query.username, password: req.query.password }).value() || res.jsonp(null);
  res.jsonp(user);
})
server.get('/users/*', (req, res) => {
  res.sendStatus(401)
})

server.get('/dasboard-details', (req, res) => {
  var data = {
    "cases": { count: 0, rate: 0, extra_count: 0 },
    "warrants": { count: 0, rate: 0, extra_count: 0 },
    "duty": { count: 0, rate: 0, extra_count: 0 },
    "supervisors": { count: 0, rate: 0, extra_count: 0 },
    "lastCrimes": {},
    "felonyWarrants": {}
  };
  var cases = db.get('cases').value()
  var warrants = db.get('warrants').value()
  var duty = db.get('users').value()
  var supervisors = duty.filter(user => user.rank >= 6)
  var lastCases = cases.filter((crime) => crime.id >= cases.length - 10)
  var felonyWarrants = warrants.filter(warrant => warrant.felony === 1)


  data['cases'] = calculateDetails(cases, "isSucsessful", 1)
  data['warrants'] = calculateDetails(warrants, "felony", 1)
  data['duty'] = calculateDetails(duty, "isActive", 1)
  data['supervisors'] = calculateDetails(supervisors, "isActive", 1)
  data['lastCrimes'] = calculateCases(lastCases);
  data['felonyWarrants'] = formatUserIDs(felonyWarrants, "criminal");

  res.jsonp(data);

})



server.use(router)
server.listen(3000, () => {
  console.log('JSON Server is running')
})