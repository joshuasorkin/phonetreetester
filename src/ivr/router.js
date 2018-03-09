const Router = require('express').Router;
const {
	welcome, 
	menu, 
	callHost, 
	handleHostResponseToOfferedGuest,
	buildPreMainMenuGather,
	noHostAvailable,
	guestCallsHost,
	statusChange,
	statusChangeConference,
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
		console.log("/welcome_promise: preMainMenuGather "+preMainMenuGather);
		res.send(preMainMenuGather);
	},error=>{
		console.log("/welcome_promise: catch this");
		console.log("/welcome_promise: "+error.toString());
	}).catch(x=>{
		console.log("/welcome_promise: outside catch block")
		console.log("/welcome_promise: "+x.toString());
	});
});


// GET: /ivr/menu
router.get('/menu', (req, res) => {
  const digit = req.query.Digits;
  const sid=req.query.sid;
  console.log("/ivr/menu: digit "+digit);
  console.log("/ivr/menu: sid "+sid);
  
  switch(digit){
	case '1':
		console.log("menu: chose 1");
		db.getRandomAvailableUser().then(value=>{
			hostPhoneNumber=value.rows[0].phonenumber;
			console.log("/menu: hostPhoneNumber "+hostPhoneNumber);
			//actual value of hostPhoneNumber will be used here in production
			responseTwiml=guestCallsHost(sid,null);
			res.send(responseTwiml);
		},error=>{
			console.log("/menu: error "+error.toString());
			responseTwiml=noHostAvailable(sid);
			res.send(responseTwiml);
		})
		//responseTwiml=guestCallsHost(sid);
		break;
	case '2':
		responseTwiml=setHostInterval();
		break;
	//default:
	//	responseTwiml=redirectWelcome();
	//	break;
  }
  
  
  //res.send(menu(digit,sid));
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
	console.log("/statusChange: status has changed to "+req.query.CallStatus);
	sendValue=statusChange(status);
	if (sendValue!=null){
		res.send(sendValue);
	}
});

router.get('/statusChangeConference',(req,res)=>{
	status=req.query.StatusCallbackEvent;
	console.log("/statusChangeConference: status has changed to "+status);
	sendValue=statusChangeConference(status);
	if (sendValue!=null){
		res.send(sendValue);
	}
});


module.exports = router;
