(function () {
    'use strict';

    angular.module('ladder')
        .directive('addMatch', AddMatchDirective);

    function AddMatchDirective() {
        return {
            templateUrl: '../views/modals/addMatch.html',
            restrict: 'E',
            controller: ['$scope', '$rootScope', '$http', '$location', function ($scope, $rootScope, $http, $location) {
                $scope.addMatch = function() {
                    $rootScope.socket.emit('add match', [$scope.player1, $scope.player2]);
                    $scope.clear();
                };
                
                $scope.clear = function() {
                    $scope.player1 = {};
                    $scope.player2 = {};
                    //$scope.$apply();
                };
            }]
        };
    }
})();