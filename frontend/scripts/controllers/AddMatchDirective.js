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
                    var validationErrors = validateAddMatch([$scope.player1, $scope.player2]);
                    if (validationErrors === '') {
                        $rootScope.socket.emit('add match', [$scope.player1, $scope.player2]);
                        $scope.clear();
                    } else {
                        $scope.validationErrors = validationErrors;
                    }
                };
                
                $scope.clear = function() {
                    $('#addMatch').modal('hide');
                    $scope.player1 = {};
                    $scope.player2 = {};
                    $scope.validationErrors = '';
                };
                
                function validateAddMatch(results) {
                    var errors = '';
                    if (!results || typeof results !== 'object'|| results.length !== 2 || !results[0].name || results[0].score === undefined || !results[1].name || results[1].score === undefined || 
                            typeof results[0].name !== 'string' || typeof results[1].name !== 'string' || 
                            !Number.isInteger(parseInt(results[0].score)) || !Number.isInteger(parseInt(results[1].score)) ||
                            results[0].score < 0 || results[0].score > 10 || results[1].score < 0 || results[1].score > 10)
                        errors += 'Names must be provided and scores must be numbers between 0 and 10.';
                    else if (results[0].name === results[1].name)
                        errors += 'The names provided cannot be the same ' + results[1].name;
                    else if (_.findIndex($scope.ladder.players, ['name', results[0].name]) === -1 || _.findIndex($scope.ladder.players, ['name', results[1].name]) === -1)
                        errors += 'One or both names provided couldn\'t be found in the ladder.';
                    else if (Math.abs($scope.ladder.players[_.findIndex($scope.ladder.players, ['name', results[1].name])].position - 
                            $scope.ladder.players[_.findIndex($scope.ladder.players, ['name', results[0].name])].position) > $scope.ladder.challengeSpan)
                        errors += 'Couldn\'t add result as it is outside challenge span of ' + $scope.ladder.challengeSpan;
                    else if (results[0].score !== 10 && results[1].score !== 10)
                        errors += 'One of the scores must be 10';
                    else if (results[0].score === 10 && results[1].score === 10)
                        errors += 'One of the scores must be less than 10';
                    return errors;
                }
            }]
        };
    }
})();