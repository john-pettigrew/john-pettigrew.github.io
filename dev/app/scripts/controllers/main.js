'use strict';

/**
 * @ngdoc function
 * @name johnPettigrewApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the johnPettigrewApp
 */
angular.module('johnPettigrewApp')
  .controller('MainCtrl', function ($scope) {
  	$('#back').hide();
  	$('#back').removeClass('slide');
  	var scene = document.getElementById('scene');
    var parallax = new Parallax(scene);
  });
