(function () {
    'use strict';

    angular.module('ladder')
        .directive('pageHeader', HeaderDirective);

    function HeaderDirective() {
        return {
            templateUrl: '../views/pageheader.html',
            restrict: 'E',
            controller: ['$scope', '$http', '$location', function ($scope, $http, $location) {
                $scope.nav = [
                    { name: 'Ladder', link: '/' },
                    { name: 'Matches', link: '/matches' },
                ];
            }]
        }
    }
})();