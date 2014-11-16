var express = require('express'),
	cheerio = require('cheerio'),
	request = require('request')
;

var load = function(sens, arrets, cb){

	var date = new Date();
		date.setMinutes(date.getMinutes() - 10);

	var day = date.getDate(),
		month = date.getMonth() + 1,
		minutes = date.getMinutes()
		heure = date.getHours()
	;

	var address = "http://www.transisere.fr/horaires_ligne/index.asp?rub_code=6&thm_id=4&gpl_id=0&lign_id=91&sens=" + sens + "&laDate=" + day + "%2F" + month + "%2F" + date.getFullYear() + "&period_code=-1&version_id=-1&heure=" + heure + "&minute=" + minutes;

	request(address, function (error, response, body) {

		if (!error && response.statusCode == 200) {
			parse(sens, arrets, cb, cheerio.load(body));
		}
	});
}

var parse = function(sens, arrets, cb, $){

	var rows = $('table tr.xRow0, table tr.xRow1');

	for (var i = 0, c = rows.length ; i < c; i++) {
		var row = $(rows[i]);

		var name = row.find('a.xLink').text(),
			ville = row.find('td:first-child').text()
		;

		if(arrets[name] && ville != "LUMBIN")
		{
			var horaires = [] ;

			var cells = row.find('td[align="center"]');

			for (var j = 0, d = cells.length ; j < d; j++) {
				var content = $(cells[j]).text() ;

				if(content != "")
				{
					var split = content.split(':'),
						date = new Date()
					;

					date.setHours(split[0]);
					date.setMinutes(split[1]);

					if(date.getTime() >= Date.now())
					{
						horaires.push(content);
					}
				}
			};

			arrets[name].horaires[sens] = horaires ;	
			arrets[name].ville = ville ;	
			arrets[name].name = name ;	
		}
	};

	cb(sens);
}

var horaires = function(req, res){

	var total = 0 ;
	var cb = function(i){
		total -= i ;
		if(total == 0){ res.json(arrets);}
	}

	var arrets = require('./arrets.json') ;
	for (var name in arrets) {
		arrets[name].horaires = {};
	};

	for(var i = 1; i <= 2 ; i++){ 
		(function(i){ load(i, arrets, cb) })(i);
		total += i ;
	}	

}



var app = express();

app
	.use(express.static(__dirname + '/public'))
	.get('/', function(req, res){
		res.sendFile(__dirname + '/public/index.html');
	})
	.get('/horaires', horaires)
;

app.listen(process.env.PORT || 8000);

