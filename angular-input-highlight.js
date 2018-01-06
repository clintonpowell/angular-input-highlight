(function() {
  var _countScrollbar, countScrollbar;

  _countScrollbar = null;

  countScrollbar = function() {
    var t;
    if (_countScrollbar !== null) {
      return _countScrollbar;
    }
    t = document.createElement('textarea');
    t.style.width = '50px';
    t.style.height = '50px';
    t.style.border = 'none';
    t.style.padding = '0';
    document.body.appendChild(t);
    _countScrollbar = t.clientWidth !== window.getComputedStyle(t).width;
    document.body.removeChild(t);
    return _countScrollbar;
  };

  angular.module('input-highlight', []).directive('highlight', [
    '$parse','inputHighlightService', function($parse, inputHighlightService) {
      return {
        restrict: 'A',
        scope: {
          ngModel: '=',
          highlights: '=highlight',
          highlightService: '=',
          highlightColor: '&?'
        },
        link: function(scope, el, attrs) {
          var canvas, container, ctx, formatting, i, input, len, mirror, prop, render, sizeProps, spread, style;
          input = el[0];
          if (input.tagName !== 'TEXTAREA') {
            return;
          }
          spread = 2;
          mirror = angular.element('<div style="position:relative"></div>')[0];
          container = angular.element('<div style="position:absolute;width:0px;height:0px;overflow:hidden;"></div>')[0];
          sizeProps = ['width', 'font-size', 'font-family', 'font-style', 'font-weight', 'font-variant', 'font-stretch', 'line-height', 'vertical-align', 'word-spacing', 'text-align', 'letter-spacing', 'text-rendering', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'box-sizing'];
          if (countScrollbar()) {
            sizeProps.push('overflow-y');
          }
          document.body.appendChild(container);
          container.appendChild(mirror);
          el.css({
            'background-position': '0 0',
            'background-repeat': 'no-repeat'
          });
          style = window.getComputedStyle(input);
          mirror.style['white-space'] = 'pre-wrap';
          mirror.style['width'];
          for (i = 0, len = sizeProps.length; i < len; i++) {
            prop = sizeProps[i];
            mirror.style[prop] = style[prop];
          }
          if (style['resize'] === 'both') {
            el.css('resize', 'vertical');
          }
          if (style['resize'] === 'horizontal') {
            el.css('resize', 'none');
          }
          canvas = document.createElement('canvas');
          ctx = canvas.getContext('2d');
          var highlightService = scope.highlightService = new inputHighlightService(input, scope.highlights);
          highlightService.onChange = function() {
            render(scope.ngModel);
          }
          scope.highlightColor = scope.highlightColor || function() { return 'rgba(250,150,0,0.5)' };
          render = function(text) {
            var color, containerRect, coords, data, j, k, len1, len2, marker, markers, offsetX, offsetY, originalText, re, rect, rects, ref, ref1,indexOffset;
            markers = [];
            originalText = text;
            mirror.innerHTML = text;
            mirror.style.width = style.width;
            canvas.width = mirror.clientWidth;
            canvas.height = mirror.clientHeight;
            indexOffset = 0;
            var color = scope.highlightColor();
            scope.highlights.forEach(function(re) {
              if(re.start >= text.length)
                return;
              mirror.innerHTML = text.slice(0,re.start) + "<span style=\"position:relative;background:red;\" data-marker=\"" + color + "\">" + text.substring(re.start,re.end) + "</span>" + text.slice(re.end+1, text.length);
              containerRect = mirror.getClientRects()[0];
              offsetX = containerRect.left;
              offsetY = containerRect.top;
              ref = mirror.querySelectorAll('span[data-marker]');
              for (j = 0, len1 = ref.length; j < len1; j++) {
                marker = ref[j];
                data = {
                  text: marker.innerHTML,
                  color: marker.getAttribute('data-marker')
                };
                rects = [];
                ref1 = marker.getClientRects();
                for (k = 0, len2 = ref1.length; k < len2; k++) {
                  rect = ref1[k];
                  coords = {
                    x: rect.left - offsetX - spread,
                    y: rect.top - offsetY,
                    width: rect.width + 2 * spread - 1,
                    height: rect.height + 1
                  };
                  ctx.fillStyle = color;
                  ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
                  rects.push(coords);
                }
                data.rectsgit = rects;
                markers.push(data);
              }
            });
            el.css('background-image', "url(" + (canvas.toDataURL()) + ")");
            return;
          };
          
          angular.element(input).on('keydown', function(e) {
            if(e.keyCode != 46 && e.keyCode != 8)
              return;
            if(input.selectionStart != input.selectionEnd) {
              highlightService.clearHighlight(
                e.keyCode == 8 && false ? input.selectionStart-1 : input.selectionStart,
                e.keyCode == 46  && false ? input.selectionEnd : input.selectionEnd
              );
            } else {
              highlightService.clearHighlight(input.selectionStart,input.selectionEnd);
            }
            
            
          });
          
          if (attrs.ngModel) {
            scope.$watch(attrs.ngModel, render);
          } else {
            render(input.value);
            angular.element(input).on('change', function() {
              return render(this.value);
            });
          }
          scope.$watch(attrs.highlight, function(_formatting) {
            formatting = _formatting || {};
            return render(input.value);
          }, true);
          scope.$on('$destroy', function() {
            return container.parentNode.removeChild(container);
          });
          window.onresize = function() {
            return render(scope.ngModel);
          };
          return el.on('scroll', function() {
            return el.css('background-position', "0 -" + input.scrollTop + "px");
          });
          
        }
      };
    }
  ]).factory('inputHighlightService', function() {
    var inputHighlightService = function(element, highlights) {
      if(!(this instanceof inputHighlightService)) return new inputHighlightService(element);
      this.element = element;
      this.highlights = highlights || [];
      return this;
    };
    
    inputHighlightService.prototype.addHighlight = function(s,e) {
      debugger;
      var service = this;
      var el = service.element;
      var start = (s == null ? el.selectionStart : s);
      var end = (e == null ? el.selectionEnd : e);
      if(_.find(service.highlights, function(h) {
        return h.start <= start && h.end >= end;
      })) return;
      
      service.joinOverlapping(start,end);
    };
    
    inputHighlightService.prototype.joinOverlapping = function(st,en) {
      var service = this;
      var overlapProc = function(s) {
        var overlapping = service.highlights.filter(function(h) {
          return h != s && ((s.start <= h.end && s.end >= h.end)
          || (s.start <= h.start && s.end >= h.start));
        });

        
        var minOverlapping = _.minBy(overlapping, function(h) { return h.start});
        var maxOverlapping = _.maxBy(overlapping, function(h) { return h.end});
        var min = Math.min(s.start, (minOverlapping || {start: Infinity}).start);
        var max = Math.max(s.end, (maxOverlapping || {end: -Infinity}).end);
        overlapping.forEach(function(o) {
          service.highlights.splice(service.highlights.indexOf(o), 1);
        });
        if(st != null) {
          service.highlights.push({start: min, end: max});
        }
      };
      
      if(st != null) {
        overlapProc({start: st, end: en})
      } else {
        service.highlights.forEach(overlapProc);
      }
    }
    
    inputHighlightService.prototype.clearHighlight = function(s,e) {
      var service = this;
      var el = service.element;
      var start = s == null ? el.selectionStart : s;
      var end = e == null ? el.selectionEnd : e;
      this.highlights.filter(function(h) {
        return h.start >= start && h.end <= end;
      }).forEach(function(h) {
        service.highlights.splice(service.highlights.indexOf(h), 1);
      });
      
      var toAdd = [];
      service.highlights.forEach(function(h) {
        if(h.end >= end && h.start <= end && h.start >= start) {
          h.start = end;
        } else if(h.start <= start && h.end >= start && h.end <= end) {
          h.end = start;
        } else if(h.start < start && h.end > end) {
          toAdd.push({start: end, end: h.end});
          h.end = start;
        }
      });
      
      toAdd.forEach(function(a) { service.highlights.push(a); });
    }
      
    return inputHighlightService;
  });

}).call(this);
