const Router = require('express').Router;
const {welcome, menu, planets} = require('./handler');

const router = new Router();

// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
	const sid=req.body.CallSid;
	res.send(welcome(sid));
});

// POST: /ivr/menu
router.post('/menu', (req, res) => {
  const digit = req.body.Digits;
  const sid=req.body.sid;
  //return res.send(menu(digit,sid));
  return res.send(welcome(sid));
});

// POST: /ivr/planets
router.post('/planets', (req, res) => {
  const digit = req.body.Digits;
  res.send(planets(digit));
});

router.post('/guestCallsHost',(req,res) => {
	
});

module.exports = router;
