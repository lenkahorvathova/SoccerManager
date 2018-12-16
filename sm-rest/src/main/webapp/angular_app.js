var app = angular.module("SoccerManagerApp", ["ngRoute", "ngCookies", "soccerManagerControllers"]);
var soccerManagerControllers = angular.module('soccerManagerControllers', []);
app.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/login', {controller: 'LoginController', templateUrl: 'partials/login.html', showMenu: false})
        .when('/home', {templateUrl: 'partials/home.html'})
        .when('/admin/teams', {templateUrl: 'partials/admin_teams.html', controller: 'AdminTeamsCtrl'})
        .when('/team/:teamId', {templateUrl: 'partials/team_detail.html', controller: 'TeamDetailCtrl'})
        .when('/userteam', {templateUrl: 'partials/user_team_detail.html', controller: 'UserTeamDetailCtrl'})
        .when('/matches', {templateUrl: 'partials/matchesList.html', controller: 'MatchesCtrl'})
        .when('/matches/create', {templateUrl: 'partials/matchCreate.html', controller: 'MatchCreateCtrl'})
        .when('/admin/newteam', {templateUrl: 'partials/admin_new_team.html', controller: 'AdminNewTeamCtrl'})
        .when('/teams/:teamId/addplayer', {templateUrl: 'partials/add_player.html', controller: 'AddPlayerToTeam'})
        .when('/players', {templateUrl: 'partials/playersList.html', controller: 'PlayersCtrl'})
        .when('/players/create', {templateUrl: 'partials/playersCreate.html', controller: 'PlayersCreateCtrl'})
        .when('/players/:playerId', {templateUrl: 'partials/playersDetail.html', controller: 'PlayersDetailCtrl'})
        .when('/players/:playerId/update', {templateUrl: 'partials/playersUpdate.html', controller: 'PlayersUpdateCtrl'})

        .otherwise({
            redirectTo: '/home'
        });
}]);

app.run(function($rootScope, $location, $cookies, $http) {
    // alert closing functions defined in root scope to be available in every template
    $rootScope.hideSuccessAlert = function () {
        $rootScope.successAlert = undefined;
    };
    $rootScope.hideWarningAlert = function () {
        $rootScope.warningAlert = undefined;
    };
    $rootScope.hideErrorAlert = function () {
        $rootScope.errorAlert = undefined;
    };
    //change the HTTP Accept header globally to signal accepting the HAL format
    $http.defaults.headers.common.Accept = 'application/hal+json, */*';
    $rootScope.globals = $cookies.get('globals') || {};
    // keep user logged in after page refresh
    console.log($rootScope.globals.currentUser);
    if ($rootScope.globals.currentUser) {

        $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        $rootScope.showMenu = true;
    }

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in

        if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
            $location.path('/login');
        }
    });
    
    $rootScope.hasBasicRights = function() {
    	return $rootScope.globals.currentUser != null;
    };
    
    $rootScope.hasAdminRights = function() {
    	if(!$rootScope.hasBasicRights()) return false;
    	return $rootScope.globals.currentUser.admin;
    };
});


/*
 * Team Controllers Section
 */
soccerManagerControllers.controller('AdminTeamsCtrl', function ($scope, $http, $rootScope, $route) {
    console.log('calling  /pa165/teams/');
    $http.get('/pa165/teams/').then(function (response) {
        var teams = response.data.content;
        $scope.teams = teams;
        console.log('AJAX loaded all teams');
        $scope.deleteTeam = function (team) {
            $http({
                method: 'DELETE',
                url: '/pa165/teams/' + team.id
            }).then(function success() {
                console.log('team removed');
                //display confirmation alert
                $rootScope.successAlert = 'A team was removed: "' + team.clubName;
                //change view to list of products
                $route.reload();

            }, function error(response) {
                //display error
                console.log("error when team");
                console.log(response);
                switch (response.data.code) {
                    case 'InvalidRequestException':
                        $rootScope.errorAlert = 'Sent data were found to be invalid by server ! ';
                        break;
                    default:
                        $rootScope.errorAlert = 'Cannot remove team ! Reason given by the server: '+response.data.message;
                        break;
                }
            });
        };

    });
});

function loadTeamPlayers($http, team, prodLink) {
    $http.get(prodLink).then(function (response) {
        var players = response.data.content;
        team.players = players;
        console.log('AJAX loaded ' + players.length + ' players to team ' + team.clubName);
    });
}


soccerManagerControllers.controller('TeamDetailCtrl',
	    function ($scope, $rootScope, $http, $route, $routeParams) {
    		var teamId = $routeParams.teamId;

	        $http.get('/pa165/teams/'+teamId).then(function (response) {
	            var team = response.data;
	            $scope.team = team;
	            console.log('AJAX loaded detail of team ' + $scope.team.clubName);
	            console.log(team.links[1].href);
	            loadTeamPlayers($http, team, team.links[1].href);
	        });
	    });

soccerManagerControllers.controller('UserTeamDetailCtrl',
    function ($scope, $rootScope, $http, $location, $route) {
        var userName = $rootScope.globals.currentUser.username;
        $http.get('/pa165/teams/users').then(function (response) {
            var team = response.data;
            console.log(response);
            $scope.team = team;
            console.log('AJAX loaded detail of team ' + $scope.team.clubName);
            console.log(team.links[1].href);
            loadTeamPlayers($http, team, team.links[1].href);
            $scope.removePlayerFromTeam = function(team, player) {
                $http({
                    method: 'DELETE',
                    url: '/pa165/teams/' + team.id + '/players/' + player.id
                }).then(function success() {
                    console.log('player removed from team');
                    //display confirmation alert
                    $rootScope.successAlert = 'A player ' + player.name + 'was removed from "' + team.clubName;
                    //change view to list of products
                    $route.reload();
                }, function (error) {
                    //display error
                    console.log("error when removing player from team");
                    console.log(error.data.message);
                    switch (error.data.code) {
                        case 'ResourceNotFoundException':
                            $rootScope.errorAlert = 'Cannot found player or team. ! ';
                            break;
                        default:
                            $rootScope.errorAlert = 'Cannot remove player ! Reason given by the server: '+error.data.message;
                            break;
                    }
                });

            }
        }, function (error) {
            //display error
            console.log("error when loading team of user");
            console.log(error.data.message);
            switch (error.data.code) {
                case 'ResourceNotFoundException':
                    $rootScope.errorAlert = 'You have no team, please pick one!';
                    $location.path("/home");
                    break;
                default:
                    $rootScope.errorAlert = 'Cannot get team of user ! Reason given by the server: '+error.data.message;
                    $location.path("/home");
                    break;
            }
        });
    });

// function removePlayerFromTeam($http, $rootScope, $route, team, player) {
//
// }

soccerManagerControllers.controller('AddPlayerToTeam', function ($scope, $http, $rootScope, $location, $routeParams) {
    console.log('calling  /pa165/players/free');
    $http.get('/pa165/players/free').then(function (response) {
        var players = response.data.content;
        $scope.players = players;
        console.log('AJAX loaded all free players');
        $scope.addPlayerToTeam = function (player) {
            $http({
                method: 'PUT',
                url: '/pa165/teams/' + $routeParams.teamId + '/players/'  + player.id
            }).then(function success() {
                console.log('player added to team');
                //display confirmation alert
                $rootScope.successAlert = 'A player was added: "' + player.name;
                //change view to list of products
                $location.path("/userteam");

            }, function error(response) {
                //display error
                console.log("error when player not added");
                console.log(response);
                switch (response.data.code) {
                    case 'InvalidRequestException':
                        $rootScope.errorAlert = 'Sent data were found to be invalid by server ! ';
                        break;
                    default:
                        $rootScope.errorAlert = 'Cannot add player to team ! Reason given by the server: '+response.data.message;
                        break;
                }
            });
        };

    });
});


soccerManagerControllers.controller('AdminNewTeamCtrl',
    function ($scope, $routeParams, $http, $location, $rootScope) {
        //prepare data for selection lists
        $scope.countries = ['SLOVAKIA', 'CZECH REPUBLIC', 'ITALY', 'SPAIN', 'ENGLAND', "GERMANY"];
        //get categories from server
        $scope.team = {
            'clubName': '',
            'country': $scope.countries[0],
            'championshipName': '',
            'budget': 1
        };
        // function called when submit button is clicked, creates product on server
        $scope.create = function (team) {
            $http({
                method: 'POST',
                url: '/pa165/teams',
                data: team
            }).then(function success() {
                console.log('created team');
                //display confirmation alert
                $rootScope.successAlert = 'A new team "' + team.name + '" was created';
                //change view to list of products
                $location.path("/admin/teams");
            }, function error(response) {
                //display error
                console.log("error when creating product");
                console.log(response);
                switch (response.data.code) {
                    case 'InvalidRequestException':
                        $rootScope.errorAlert = 'Sent data were found to be invalid by server ! ';
                        break;
                    default:
                        $rootScope.errorAlert = 'Cannot create team ! Reason given by the server: '+response.data.message;
                        break;
                }
            });
        };
    });

/*
 * Match Controllers Section
 */
soccerManagerControllers.controller('MatchesCtrl',
    function ($scope, $routeParams, $rootScope, $http) {			
		loadMatches($scope, $http);			
		
		//define method isAlreadyPlayed
		$scope.alreadyPlayed = function (match) {
			return alreadyPlayed(match);
		};
		//define method canBeSimulated
		$scope.canBeSimulated = function (match) {
			return canBeSimulated(match);
		}
		
		//define method simulateMatch
		$scope.simulateMatch = function(match) {
			console.log('simulateMatch: matchId = '+match.id);
		    $http.post(findHrefFromLinks(match.links, 'simulate')).then(
				function success(response) {
					console.log('simulated match ' + match.id + ' on server');

					$rootScope.successAlert = 'Simulated match "'+match.id+'"';
					$rootScope.errorAlert = null;
					
					//load new list of all products
					loadMatches($scope, $http);
				},
				function error(response) {
					console.log('server returned error');
				    $rootScope.successAlert = null;
					$rootScope.errorAlert = 'Cannot simulate match "'+match.id+'"!';
				});
			};
			
			//define method delete
			$scope.deleteMatch = function(match) {
				console.log('deleteMatch: matchId = '+match.id);
			    $http.delete(findHrefFromLinks(match.links, 'delete')).then(
					function success(response) {
						console.log('delete match ' + match.id + ' on server');

						$rootScope.successAlert = 'Deleted match "'+match.id+'"';
						$rootScope.errorAlert = null;
						
						//load new list of all products
						loadMatches($scope, $http);
					},
					function error(response) {
						console.log('server returned error');
					    $rootScope.successAlert = null;
						$rootScope.errorAlert = 'Cannot delete match "'+match.id+'"!';
					});
				};
});

soccerManagerControllers.controller('MatchCreateCtrl',
	    function ($scope, $routeParams, $http, $location, $rootScope) {
	        //set object bound to form fields
	        var now = new Date();
	        now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0);
	        var min = new Date(now);
	        min.setFullYear(min.getFullYear() - 5);
	        var max = new Date(now);
	        max.setFullYear(max.getFullYear() + 5);
	        
	        $scope.match = {
	        	'date': now,
	        };
	        
	        $scope.minMatchDate = min;
	        $scope.maxMatchDate = max;
	        
	        console.log('match create cntrl');
	        
        	loadTeams($scope, $http);

	        // function called when submit button is clicked, creates match on server
	        $scope.create = function (match) {      	
	            $http({
	                method: 'POST',
	                url: '/pa165/matches',
	                data: match
	            }).then(function success(response) {
	                console.log('created match');
	                var createdMatch = response.data;
	                //display confirmation alert
	                $rootScope.successAlert = 'A new match #'+createdMatch.id+' was created';
	                //change view to list of categories
	                $location.path("/matches");
	            }, function error(response) {
	                //display error
	            	$rootScope.errorAlert = 'Cannot create match !';
	            });
	        };
	    });

/*
 * Players' Controllers Section
 */
soccerManagerControllers.controller('PlayersCtrl',
    function ($scope, $routeParams, $rootScope, $http) {
        loadPlayers($scope, $http);

        $scope.isFree = function (player) {
            return player.team == null;
        };

        $scope.deletePlayer = function (player) {
            console.log('Deleting a player ' + player.playerName + ' with an ID ' + player.id);

            $http.delete('/pa165/players/' + player.id).then(
                function success(response) {
                    console.log('Deleted a player ' + player.id + ' on the server');

                    $rootScope.successAlert = 'Deleted a player "' + player.playerName + '"';
                    loadPlayers($scope, $http);
                },
                function error(response) {
                    console.log("Error when deleting a player!");
                    console.log(response);

                    switch (response.data.code) {
                        case 'ResourceNotFoundException':
                            $rootScope.errorAlert = 'Cannot delete non-existent player ! ';
                            break;
                        default:
                            $rootScope.errorAlert = 'Cannot delete player! Reason given by the server: ' + response.data.message;
                            break;
                    }
                })
        }
    }
);

soccerManagerControllers.controller('PlayersCreateCtrl',
    function ($scope, $routeParams, $rootScope, $http, $location) {
        $scope.now = new Date();
        $scope.countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Anguilla", "Antigua & Barbuda",
            "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
            "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia & Herzegovina",
            "Botswana", "Brazil", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
            "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Chad", "Chile", "China", "Colombia", "Congo",
            "Cook Islands", "Costa Rica", "Cote D'Ivoire", "Croatia", "Cruise Ship", "Cuba", "Cyprus", "Czech Republic",
            "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
            "Equatorial Guinea", "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland",
            "France", "French Polynesia", "French West Indies", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
            "Gibraltar", "Greece", "Greenland", "Grenada", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea Bissau",
            "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
            "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya",
            "Kuwait", "Kyrgyz Republic", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
            "Lithuania", "Luxembourg", "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali",
            "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat",
            "Morocco", "Mozambique", "Namibia", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia",
            "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Panama",
            "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar",
            "Reunion", "Romania", "Russia", "Rwanda", "Saint Pierre & Miquelon", "Samoa", "San Marino", "Satellite",
            "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
            "South Africa", "South Korea", "Spain", "Sri Lanka", "St Kitts & Nevis", "St Lucia", "St Vincent",
            "St. Lucia", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
            "Tanzania", "Thailand", "Timor L'Este", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia", "Turkey",
            "Turkmenistan", "Turks & Caicos", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
            "United States", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam",
            "Virgin Islands (US)", "Yemen", "Zambia", "Zimbabwe"];
        $scope.positions = ['DEFFENSE', 'OFFENSE', 'MIDFIELD'];
        $scope.footed_options = ['RIGHT', 'LEFT', 'BOTH'];

        $scope.create = function (player) {
            console.log('Creating a player ' + player.playerName);

            $http.post('/pa165/players', player).then(
                function success(response) {
                    console.log('Created a player ' + player.id + ' on the server');

                    $rootScope.successAlert = 'Created a player "' + player.playerName + '"';
                    $location.path("/players");
                },
                function error(response) {
                    console.log("Error when creating a player!");
                    console.log(response);

                    $rootScope.errorAlert = 'Cannot create player! Reason given by the server: ' + response.data.message;
                })
        }
    }
);

soccerManagerControllers.controller('PlayersDetailCtrl',
    function ($scope, $routeParams, $rootScope, $http) {
        var playerId = $routeParams.playerId;

        $http.get('/pa165/players/' + playerId).then(function (response) {
            $scope.player = response.data;

            console.log('AJAX loaded a detail of a player ' + $scope.player.playerName)
        })
    }
);

soccerManagerControllers.controller('PlayersUpdateCtrl',
    function ($scope, $routeParams, $rootScope, $http, $location) {
        $scope.positions = ['DEFFENSE', 'OFFENSE', 'MIDFIELD'];
        $scope.footed_options = ['RIGHT', 'LEFT', 'BOTH'];
        var playerId = $routeParams.playerId;

        $http.get('/pa165/players/' + playerId).then(function (response) {
            $scope.player = response.data;

            console.log('AJAX loaded a player ' + $scope.player.playerName)
        });

        $scope.update = function (player) {
            console.log('Updating a player ' + player.playerName);

            $http.put('/pa165/players', player).then(
                function success(response) {
                    console.log('Updated a player ' + player.id + ' on the server');

                    $rootScope.successAlert = 'Updated a player "' + player.playerName + '"';
                    $location.path("/players");
                },
                function error(response) {
                    console.log("Error when updating a player!");
                    console.log(response);

                    $rootScope.errorAlert = 'Cannot update player! Reason given by the server: ' + response.data.message;
                })
        }
    }
);

/* 
 * Matches functions
 */

function loadMatches($scope, $http) {
	$http.get('/pa165/matches/').then(function (response) {
		console.log('AJAX response.data: ' + response.data);
        $scope.matches = response.data.content;
        console.log('AJAX loaded list of ' + $scope.matches.length + 'matches.');
        sortMatchesByDate($scope.matches);
	});
}

function loadTeams($scope, $http) {
	$http.get('/pa165/teams/').then(function (response) {
		console.log('AJAX response.data: ' + response.data);
        $scope.teams = response.data.content;
        console.log('AJAX loaded list of ' + $scope.teams.length + 'teams.');
	});
}

function findHrefFromLinks(links, relName) {
	var i;
	for(i=0;i<links.length;i++) {
		if(links[i].rel == relName) return links[i].href;
	}
	return null;
}

function alreadyPlayed(match) {
	if(match.homeTeamGoals != null) return true;
	if(match.awayTeamGoals != null) return true;
	return false;
}

function canBeSimulated(match) {
	if(alreadyPlayed(match)) return false;
	
	var date = dateTimeStrToDate(match.date);
	var now = new Date();
	
	if(now < date) return false;
	
	return true;
}

function sortMatchesByDate(matches) {
	matches.sort(compareMatchesByDate);
}

function compareMatchesByDate(m1, m2) {
	var d1 = dateTimeStrToDate(m1.date);
	var d2 = dateTimeStrToDate(m2.date);
	
	if (d1 > d2) return 1;
	if (d1 < d2) return -1;
	return 0;
}

function dateTimeStrToDate(dateTimeString) {
	return Date.parse(dateTimeString);
}

/*
 * Players' functions
 */
function loadPlayers($scope, $http) {
    $http.get('/pa165/players/').then(function (response) {
        console.log('AJAX response.data:');
        console.log(response.data);

        $scope.players = response.data.content;

        console.log('AJAX loaded list of ' + $scope.players.length + ' players.');
    });
}