'use strict';

/**
 * @ngdoc function
 * @name johnPettigrewApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the johnPettigrewApp
 */
angular.module('johnPettigrewApp')
  .controller('MainCtrl', function ($scope, $location) {
  	$('#back').hide();
  	$('#back').removeClass('slide');
  	$scope.leaveMain = function(view){
  		$location.path(view);
  	}
  });
