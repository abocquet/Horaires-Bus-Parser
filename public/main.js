
(function(){

	function load(url, resolve) {
  
		var xhr = new XMLHttpRequest();
			xhr.open('GET', url);

		xhr.onreadystatechange = function() {

			if (xhr.readyState == 4 && xhr.status == 200) {
				resolve(xhr.responseText);
			}
		};

		xhr.send(null);
	};

	function getDistance(pos1, pos2){
		var a = Math.PI / 180,
			lat1 = pos1.latitude * a,
			lat2 = pos2.latitude * a, 
			lon1 = pos2.longitude * a, 
			lon2 = pos2.longitude * a,  
			t1 = Math.sin(lat1) * Math.sin(lat2), 
			t2 = Math.cos(lat1) * Math.cos(lat2), 
			t3 = Math.cos(lon1 - lon2), 
			t4 = t2 * t3, 
			t5 = t1 + t4, 
			rad_dist = Math.atan(-t5/Math.sqrt(-t5 * t5 +1)) + 2 * Math.atan(1)
		;
		
		return (rad_dist * 3437.74677 * 1.1508) * 1.6093470878864446;
	};

	function getPosition(solve, reject){

		if(!navigator.geolocation)
		{
			reject("Votre appareil ne dispose pas de géolocalisation");
		}

		navigator.geolocation.getCurrentPosition(
			function(pos){
				solve(pos.coords);
			},
			function(error) {
				var info = "Erreur lors de la géolocalisation : ";
				switch(error.code) {
					case error.TIMEOUT:
						info += "La localisation prend trop de temps";
					break;
					case error.PERMISSION_DENIED:
					info += "Vous n’avez pas donné la permission";
					break;
					case error.POSITION_UNAVAILABLE:
						info += "La position n’a pu être déterminée";
					break;
					case error.UNKNOWN_ERROR:
						info += "Erreur inconnue";
					break;
				}

				reject(info);
			},
			{
				enableHighAccuracy: true
			}
		);
	};

	function refresh(){

		view.state.textContent = 'Chargement en cours';
		view.horaires.container.innerHTML = "" ;
		view.arret.textContent = "" ;

		var arrets = null, position = null ;

		var reject = function(error){
			view.state.textContent = error ? error : "An error ocurred during the process. Like the rabbit." ;
		};

		load("/horaires", function(res){
			arrets = JSON.parse(res) ;
			selectArret(arrets, position);
		});

		getPosition(function(pos){
			position = pos ;
			selectArret(arrets, position);
		}, reject);
	};

	var selectArret = function(arrets, position)
	{
		if(!arrets || !position){ return false ; }

		var selected = { distance: 1000000, name: "42", ville: "Montréal", horaires: { 0: [], 1: []} };

		for(var name in arrets){
			var distance = getDistance(position, arrets[name]);
			if(distance < selected.distance){
				selected = arrets[name];
				selected.distance = distance ;
			}
		}

		if(sens == 0){
			sens = selected.sens ;
		}

		afficher(selected, sens);

	};

	var afficher = function(arret, sens){

		console.log(arret);
		view.arret.textContent = "Arret de " + arret.name + " (" + arret.ville + ") en direction de " + (sens < 2 ? "Grenoble" : "Crolles") ;
		for (var i = 0, c = arret.horaires[sens].length ; i < c; i++) {
			var element = document.createElement('li');
				element.textContent = arret.horaires[sens][i] ;

			view.horaires.container.appendChild(element);
		};

		view.state.textContent = "" ;
	};

	var view = {
		state: document.querySelector('#state'),
		arret: document.querySelector('#arret'),
		horaires: {
			container: document.querySelector('ul'),
			hiddens: []
		},

		buttons: {
			more: document.querySelector('input#more'),
			change: document.querySelector('input#change'),
			refresh: document.querySelector('input#refresh')
		}
	};

	// SENS: GRENOBLE = 1 : CROLLES = 2 : UNDEFINED = 0
	var sens = 0 ;

	view.buttons.change.onclick = function(){ 
		sens = sens == 1 ? 2 : 1 ;
		refresh();
	};

	view.buttons.refresh.onclick = function(){
		refresh();
	};

	refresh();

})();
