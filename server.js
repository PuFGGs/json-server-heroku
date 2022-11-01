const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
var db = router.db.chain()

server.use(middlewares)

server.get('/users', (req, res) => {
    var user = db.get('users').find({username: req.query.username, password: req.query.password}).value() || res.jsonp(null);
    res.jsonp(user);
    console.log(user);
})

server.get('/users/*', (req, res) => {
    res.sendStatus(401)
    console.log("rejected query");
})



server.use(router)
server.listen(3000, () => {
  console.log('JSON Server is running')
})