//so if i understand the handler structure,
//what we are doing is: export functions that are decision points
//so that we can redirect to them
//or maybe it's that we export functions that end with the need to send POST request
//back to the router
//so how should we handle the client.calls.create() request?  seems like this breaks the
//router/handler abstraction

const VoiceResponse = require('twilio').twiml.VoiceResponse;
var request = require('request');




exports.welcome = function welcome(sid) {
	
	console.log("welcome: sid is "+sid);
  const voiceResponse = new VoiceResponse();
  //const bodyUrl = '';

  params={'sid':sid}
  url=buildGetUrl('/ivr/menu',params);
  
  const gather = voiceResponse.gather({
    action: '/ivr/menu',
    numDigits: '1',
    method: 'GET',
	timeout: 10
  });
	gather.say("Welcome to Vent.  Press 1 to call a host.  Press 2 to set your own host interval.");
  //gather.play({loop: 3}, bodyUrl);

  responseStr=voiceResponse.toString();
  return responseStr;
};

exports.menu = function menu(digit,sid) {
	console.log("menu: starting");
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
	baseUrl=process.env.PHONETREETESTER_URL+"callHost";
	console.log("guestCallsHost: baseURL "+baseURL);
	//todo: find more secure source of unique conference ID (maybe hash of sid)
	
	/*
	conferenceName=sid;
	params={'conferenceName':conferenceName};
	url=buildGetUrl(baseUrl,params);	
	var call=client.calls.create({
		url:url,
		to: CELL_PHONE_NUMBER,
		from: process.env.TWILIO_PHONE_NUMBER,
		method: 'GET'
	});
	*/
	
	const response = new VoiceResponse();
	response.say({
		voice: 'alice',
		language: 'en-AU'
	},"Thank you for calling Vent. Please wait while we find a host.");
	const dial = response.dial();
	dial.conference(sid);
	responseStr=response.toString();
	console.log("guestCallsHost: "+responseStr);
	return responseStr;
};

function setHostInterval(){
	const response=new VoiceResponse();
	response.say("Setting host interval.");
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
