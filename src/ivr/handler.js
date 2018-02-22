//so if i understand the handler structure,
//what we are doing is: export functions that are decision points
//so that we can redirect to them
//or maybe it's that we export functions that end with the need to send POST request
//back to the router
//so how should we handle the client.calls.create() request?  seems like this breaks the
//router/handler abstraction

//todo: refactor methods like buildGetUrl() and sayAliceAustralia() into SRO-observant files/classes

const VoiceResponse = require('twilio').twiml.VoiceResponse;
const client=require('twilio')(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);
var request = require('request');
const languageConfig="en-AU";




exports.welcome = function welcome(sid) {
	
	console.log("welcome: sid is "+sid);
	
	console.log("welcome: list client properties");
	console.log(Object.getOwnPropertyNames(client));
	
	//adding this to check if client is instantiated
	client
  .calls(sid)
  .fetch()
  .then(call => console.log("call.to "+call.to)).catch(function(error){
	console.log("error: "+error.toString());
  });
		
  const voiceResponse = new VoiceResponse();
  //const bodyUrl = '';

  params={'sid':sid}
  url=buildGetUrl('/ivr/menu',params);
  
  const gather = voiceResponse.gather({
    action: url,
    numDigits: '1',
    method: 'GET',
	timeout: 10
  });
	sayAlice(gather,languageConfig,"Welcome to Vent.  Press 1 to call a host.  Press 2 to set your own host interval.");
  //gather.play({loop: 3}, bodyUrl);

  responseStr=voiceResponse.toString();
  return responseStr;
};

exports.menu = function menu(digit,sid) {
	console.log("menu: starting");
	console.log("menu: digit "+digit);
  var responseTwiml;
  switch(digit){
	case '1':
		console.log("menu: chose 1");
		responseTwiml=guestCallsHost(sid);
		break;
	case '2':
		responseTwiml=setHostInterval();
		break;
	//default:
	//	responseTwiml=redirectWelcome();
	//	break;
  }
  return responseTwiml;
};


function guestCallsHost(sid){
	baseUrl=process.env.PHONETREETESTER_URL+'ivr/callHost';
	console.log("guestCallsHost: baseUrl "+baseUrl);
	//todo: find more secure source of unique conference ID (maybe hash of sid)
	
	console.log("guestCallsHost: cell phone number "+process.env.CELL_PHONE_NUMBER);
	console.log("guestCallsHost: twilio phone number "+process.env.TWILIO_PHONE_NUMBER);	
	conferenceName=sid;
	params={'conferenceName':conferenceName};
	url=buildGetUrl(baseUrl,params);
	console.log("guestCallsHost: url "+url);
	
	//adding this to check if client is instantiated
	client
  .calls(sid)
  .fetch()
  .then(call => console.log("guestCallsHost: call.to "+call.to)).catch(function(error){
	console.log("error: "+error.toString());
  });
	
	
	var call=client.calls.create({
		url:url,
		to: process.env.CELL_PHONE_NUMBER,
		from: process.env.TWILIO_PHONE_NUMBER,
		method: 'GET'
	}).then(x=>console.log("guestCallsHost: logging return value of client calls create "+x));
	
	/*
	var call=client.calls.create({
		url:baseUrl,
		to: process.env.CELL_PHONE_NUMBER,
		from: process.env.TWILIO_PHONE_NUMBER,
	}).then(x=>console.log("guestCallsHost: logging return value of client calls create "+x));
	*/

	
	const response = new VoiceResponse();
	sayAlice(response,languageConfig,"Thank you for calling Vent. Please wait while we find a host.");
	const dial = response.dial();
	dial.conference(sid);
	responseStr=response.toString();
	console.log("guestCallsHost: "+responseStr);
	return responseStr;
};

function setHostInterval(){
	const response=new VoiceResponse();
	response.say("Setting host interval.");
	return response.toString();
}

exports.callHost=function callHost(conferenceName){
	const response=new VoiceResponse();
	
	params={'conferenceName':conferenceName};
	
	baseUrl='/ivr/handleHostResponseToOfferedGuest';
	url=buildGetUrl(baseUrl,params);
	
	gather=response.gather({
		action:url,
		method:'GET'
	});
	gather.say("You have a call from Vent.  Press 1 to accept, press any other key to refuse.");
	response.say("We didn't receive input.  Goodbye!");
	return response.toString();
};

exports.handleHostResponseToOfferedGuest=function handleHostResponseToOfferedGuest(digits,conferenceName){
	const response=new VoiceResponse();
	if (digits=="1"){
		response.say("Thank you, now connecting you to guest.");
		dial=response.dial();
		dial.conference(conferenceName);
	}
	else{
		response.say("You didn't press 1.");
	}
	responseTwiml=response.toString();
	return responseTwiml;
}


exports.planets = function planets(digit) {
  const optionActions = {
    '2': '+12024173378',
    '3': '+12027336386',
    '4': '+12027336637',
  };

  if (optionActions[digit]) {
    const twiml = new VoiceResponse();
    twiml.dial(optionActions[digit]);
    return twiml.toString();
  }

  return redirectWelcome();
};

/**
 * Returns Twiml
 * @return {String}
 */
function giveExtractionPointInstructions() {
  const twiml = new VoiceResponse();

  twiml.say(
    'To get to your extraction point, get on your bike and go down ' +
    'the street. Then Left down an alley. Avoid the police cars. Turn left ' +
    'into an unfinished housing development. Fly over the roadblock. Go ' +
    'passed the moon. Soon after you will see your mother ship.',
    {voice: 'alice', language: 'en-GB'}
  );

  twiml.say(
    'Thank you for calling the ET Phone Home Service - the ' +
    'adventurous alien\'s first choice in intergalactic travel'
  );

  twiml.hangup();

  return twiml.toString();
}

/**
 * Returns a TwiML to interact with the client
 * @return {String}
 */
function listPlanets() {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    action: '/ivr/planets',
    numDigits: '1',
    method: 'POST',
  });

  gather.say(
    'To call the planet Broh doe As O G, press 2. To call the planet DuhGo ' +
    'bah, press 3. To call an oober asteroid to your location, press 4. To ' +
    'go back to the main menu, press the star key ',
    {voice: 'alice', language: 'en-GB', loop: 3}
  );

  return twiml.toString();
}

/**
 * Returns an xml with the redirect
 * @return {String}
 */
function redirectWelcome() {
  const twiml = new VoiceResponse();

  twiml.say('Returning to the main menu', {
    voice: 'alice',
    language: 'en-GB',
  });

  twiml.redirect('/ivr/welcome');

  return twiml.toString();
}

//creates a url from an array of key-value pairs
//should probably move this to a separate utility class
function buildGetUrl(baseUrl,paramArray){
	url=baseUrl+"?";
	Object.keys(paramArray).forEach(function(key){
		url+=key+"="+encodeURIComponent(paramArray[key])+"&";
	});
	url=url.slice(0,-1);
	return url;
	
}

function sayAlice(voiceResponse,language,text){
	voiceResponse.say({
		voice: 'alice',
		language: language
	},text);
}
