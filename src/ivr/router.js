const Router = require('express').Router;
const {welcome, menu, planets} = require('./handler');

const router = new Router();

// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
	const sid=req.body.CallSid;
	console.log("/welcome: sid "+sid);
	res.send(welcome(sid));
});

// POST: /ivr/menu
router.get('/menu', (req, res) => {
  const digit = req.query.Digits;
  const sid=req.query.sid;
  console.log("/ivr/menu: digit "+digit);
  console.log("/ivr/menu: sid "+sid);
  return res.send(menu(digit,sid));
  //return res.send(welcome(sid));
});

// POST: /ivr/planets
router.post('/planets', (req, res) => {
  const digit = req.body.Digits;
  res.send(planets(digit));
});

router.post('/guestCallsHost',(req,res) => {
	
});

module.exports = router;
