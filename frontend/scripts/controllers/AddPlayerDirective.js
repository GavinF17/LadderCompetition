(function () {
    'use strict';

    angular.module('ladder')
        .directive('addPlayer', AddPlayerDirective);

    function AddPlayerDirective() {
        return {
            templateUrl: '../views/modals/addPlayer.html',
            restrict: 'E',
            controller: ['$scope', '$rootScope', '$http', '$location', function ($scope, $rootScope, $http, $location) {
                $scope.addPlayer = function() {
                    $rootScope.socket.emit('add player', $scope.addName);
                    $scope.clear();
                };
                
                $scope.clear = function() {
                    $scope.addName = '';
                };
            }]
        };
    }
})();