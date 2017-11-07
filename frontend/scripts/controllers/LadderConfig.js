(function () {
    'use strict';
    
    angular.module('ladder')
        .config(['$routeProvider', '$locationProvider', config])
        //.run(['$http', run]);

    function config($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '../views/ladder.html',
                //controller: 'LadderController'
            })
            .when('/matches', {
                templateUrl: '../views/matches.html',
                //controller: 'LadderController'
            })
            .otherwise('/');
        //$locationProvider.html5Mode(true);
    }
})();
