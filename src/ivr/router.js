const Router = require('express').Router;
const {
	welcome, 
	menu, 
	callHost, 
	handleHostResponseToOfferedGuest,
	planets} = require('./handler');
var bodyParser = require('body-parser');
const client=require('twilio')(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);
	
const router = new Router();
router.use(bodyParser.urlencoded({ extended: false }));


// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
	const sid=req.body.CallSid;
	console.log("/welcome: sid "+sid);
	res.send(welcome(sid));
});

// GET: /ivr/menu
router.get('/menu', (req, res) => {
  const digit = req.query.Digits;
  const sid=req.query.sid;
  console.log("/ivr/menu: digit "+digit);
  console.log("/ivr/menu: sid "+sid);
  
  //checking if we can make call from router
  	var call=client.calls.create({
		url:'/ivr/callHost?conferenceName='+sid,
		to: process.env.CELL_PHONE_NUMBER,
		from: process.env.TWILIO_PHONE_NUMBER,
		method: 'GET'
	});
  
  res.send(menu(digit,sid));
  //return res.send(welcome(sid));
});

// GET: /ivr/callHost
router.get('/callHost', (req, res) => {
	console.log("reached callHost endpoint");
  const conferenceName=req.query.conferenceName;
  console.log("/ivr/callHost: conferenceName "+conferenceName);
  res.send(callHost(conferenceName));
});

// GET: /ivr/handleHostResponseToOfferedGuest
router.get('/handleHostResponseToOfferedGuest',(req,res)=>{
	var digits=req.query.Digits;
	var conferenceName=req.query.conferenceName;
	
	res.send(handleHostResponseToOfferedGuest(digits,conferenceName));
});




// POST: /ivr/planets
router.post('/planets', (req, res) => {
  const digit = req.body.Digits;
  res.send(planets(digit));
});

router.post('/guestCallsHost',(req,res) => {
	
});

module.exports = router;
