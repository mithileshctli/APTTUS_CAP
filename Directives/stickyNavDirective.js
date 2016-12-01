/**
 * Directive: stickyNavDirective
 * 
 */
;(function() {
    'use strict';

    
    angular.module('APTPS_ngCPQ').directive('stickyNav', StickyNav);

    StickyNav.$inject = ['$window'];

    function StickyNav($window){
        var directive;
        
        function stickyNavLink(scope, element, attributes){
			var w = angular.element($window),
			size = element[0].clientHeight,
			top = 0;
			var classname = attributes.className;
			
			function toggleStickyNav(){
				if(!element.hasClass(classname) && $window.pageYOffset > top + size){
					element.addClass(classname);
				} else if(element.hasClass(classname) && $window.pageYOffset <= top + size){
					element.removeClass(classname);
				}
			}

			scope.$watch(function(){
				return element[0].getBoundingClientRect().top + $window.pageYOffset;
			}, function(newValue, oldValue){
				if(newValue !== oldValue && !element.hasClass(classname)){
					top = newValue;
				}
			});

			w.bind('resize', function stickyNavResize(){
				element.removeClass(classname);
				top = element[0].getBoundingClientRect().top + $window.pageYOffset;
				toggleStickyNav();
			});
			w.bind('scroll', toggleStickyNav);
		}

        directive = {
            scope: {},
            restrict: 'A',
            link: stickyNavLink
        };
        return directive;
    };
}).call(this);
