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
  	$scope.leaveMain = function(view){
  		$location.path(view);
  	}
  	var displayContent = function(){
  		console.log('test');
  		$('#pageContent').css('display', 'block');
  		$('#pageContent').addClass('fadeIn');
  	}
  	var startAnimations = function(){
  		//expand box
  		$('#box').css('display', 'block');
  		//$('#box').addClass('box');
  		setTimeout(displayContent, 2000);
  	}

  	//Remove back arrow
  	$('#back').hide();
  	$('#back').removeClass('slide');
  	startAnimations();
  });
