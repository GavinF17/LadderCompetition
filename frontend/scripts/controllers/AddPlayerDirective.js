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
                    var validationErrors = validateAddPlayer($scope.addName);
                    if (validationErrors === '') {
                        $rootScope.socket.emit('add player', $scope.addName);
                    $scope.clear();
                    } else {
                        alert(validationErrors);
                    }
                };
                
                $scope.clear = function() {
                    $('#addPlayer').modal('hide');
                    $scope.addName = '';
                };
                
                function validateAddPlayer(name) {
                    var errors = '';
                    // Check type
                    if (typeof name !== 'string')
                        errors += 'Name of player to add must be a string.';
                    // Check length
                    else if (name.length === 0)
                        errors += 'Name must not be blank.\n';
                    else if (name.length > 15)
                        errors += 'Name must not be larger than 15 characters.';
                    // Ensure doesn't exist
                    else if (_.findIndex($scope.ladder.players, ['name', name]) !== -1)
                        errors += 'Can\'t add player "' + name + '": already exists';

                    return errors;
                }
            }]
        };
    }
})();