const Router = require('express').Router;
const {
	welcome, 
	menu, 
	callHost, 
	handleHostResponseToOfferedGuest,
	planets} = require('./handler');
var bodyParser = require('body-parser');
var db=require('./database');

const router = new Router();
router.use(bodyParser.urlencoded({ extended: false }));


// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
	
	const fromNum=req.body.From;
	const sid=req.body.CallSid;
	console.log("/welcome: sid "+sid);
	res.send(welcome(fromNum,sid));
});

// POST: /ivr/welcome_promise
router.post('/welcome_promise',(req,res) => {
	const fromNum=req.body.From;
	const sid=req.body.CallSid;
	console.log("/welcome_promise: sid "+sid);
	db.getUser_promise(fromNum).then(value=>{
		console.log("/welcome_promise: then");
		preMainMenuGather=buildPreMainMenuGather(sid);
		res.send(preMainMenuGather);
	},error=>{
		console.log("/welcome_promise: catch this");
		console.log("/welcome_promise: "+error.toString());
	});
});


// GET: /ivr/menu
router.get('/menu', (req, res) => {
  const digit = req.query.Digits;
  const sid=req.query.sid;
  console.log("/ivr/menu: digit "+digit);
  console.log("/ivr/menu: sid "+sid);
  
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

router.get('/statusChange',(req,res)=> {
	status=req.query.CallStatus;
	console.log("statusChange: status has changed to "+req.query.CallStatus);
	res.send(statusChange(status));
});

router.post('/guestCallsHost',(req,res) => {
	
});

module.exports = router;
