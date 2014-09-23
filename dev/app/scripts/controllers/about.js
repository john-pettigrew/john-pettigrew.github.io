'use strict';

/**
 * @ngdoc function
 * @name johnPettigrewApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the johnPettigrewApp
 */
angular.module('johnPettigrewApp')
  .controller('AboutCtrl', function ($scope, $location) {
  	$('#back').show();
  	$('#back').addClass('slide');
  	$scope.goToMain = function(){
  		$location.path('main');
  	}
  });
