//  Authentication service. Wrapped in an IIFE to avoid global variables
//  Purpose: To handle all user authentication methods



var AuthenticationService = function($http, $cookies, $rootScope, $timeout) {

    //  Function defined for when the user login is initiate
    var Login = function (username, password, callback) {
        //  (The following code will be replaced by a real service you'd hope!)
        var response = { success: username === 'admin' && password === 'admin' };
        if(!response.success) {
            response.message = 'Username or password is incorrect, try "iain" & "password"';
        }
        callback(response);
    };

    //  Sets the cookie and the state to logged in
    var SetCredentials = function (username, password) {
        var authdata = username + ':' + password; // We shoud really encrypt this, but this is left clear case for this example :)
        $rootScope.globals = {
            currentUser: {
                username: username,
                authdata: authdata
            }
        };

        $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
        $cookies.put('globals', $rootScope.globals);
    };

    //  Clears the cookie and the state for the application to recognise a logged out state
    var ClearCredentials = function () {
        $rootScope.globals = {};
        $cookies.remove('globals');
        $http.defaults.headers.common.Authorization = 'Basic ';
    };


    return {
        Login: Login,
        SetCredentials: SetCredentials,
        ClearCredentials: ClearCredentials
    };

};

//  Register the service with the application
var module = angular.module("SoccerManagerApp");
module.factory("AuthenticationService", AuthenticationService)

