// var crossfilter = require('crossfilter');
var utils = require('../utils');
var zoomed = require('../zoom/zoomed');
var ini_doubleclick = require('../zoom/ini_doubleclick');
var reset_zoom = require('../zoom/reset_zoom');
var resize_dendro = require('./resize_dendro');
var resize_grid_lines = require('./resize_grid_lines');
var resize_super_labels = require('./resize_super_labels');
var resize_spillover = require('./resize_spillover');
var resize_borders = require('./resize_borders');
var resize_row_labels = require('./resize_row_labels');
var resize_highlights = require('./resize_highlights');
var normal_name = require('./normal_name');
var bound_label_size = require('./bound_label_size');
var resize_row_viz = require('./resize_row_viz');
var resize_col_labels = require('./resize_col_labels');
var resize_col_text = require('./resize_col_text');
var resize_col_triangle = require('./resize_col_triangle');
var resize_col_hlight = require('./resize_col_hlight');
var recalc_params_for_resize = require('./recalc_params_for_resize');
var resize_row_tiles = require('./resize_row_tiles');

module.exports = function(params, inst_clust_width, inst_clust_height, set_margin_left, set_margin_top) {

  // first resize hte svg 
  d3.select(params.viz.viz_wrapper)
      .style('float', 'right')
      .style('margin-top',  set_margin_top  + 'px')
      .style('width',  inst_clust_width  + 'px')
      .style('height', inst_clust_height + 'px');


  params = recalc_params_for_resize(params);

  reset_zoom(params);

  var svg_group = d3.select(params.viz.viz_svg);

  // redefine x and y positions
  _.each(params.network_data.links, function(d){
    d.x = params.matrix.x_scale(d.target);
    d.y = params.matrix.y_scale(d.source);
  });


  // disable zoom while transitioning
  svg_group.on('.zoom', null);

  params.zoom_behavior
    .scaleExtent([1, params.viz.real_zoom * params.viz.zoom_switch])
    .on('zoom', function(){
      zoomed(params);
    });

  // reenable zoom after transition
  if (params.viz.do_zoom) {
    svg_group.call(params.zoom_behavior);
  }

  // prevent normal double click zoom etc
  ini_doubleclick(params);

  svg_group
    .attr('width', params.viz.svg_dim.width)
    .attr('height', params.viz.svg_dim.height);


  svg_group.select('.super_background')
    .style('width', params.viz.svg_dim.width)
    .style('height', params.viz.svg_dim.height);

  svg_group.select('.grey_background')
    .attr('width', params.viz.clust.dim.width)
    .attr('height', params.viz.clust.dim.height);



  var row_nodes = params.network_data.row_nodes;
  var row_nodes_names = _.pluck(row_nodes, 'name');

  resize_row_tiles(params, svg_group);

  svg_group.selectAll('.highlighting_rect')
    .attr('width', params.matrix.x_scale.rangeBand() * 0.80)
    .attr('height', params.matrix.y_scale.rangeBand() * 0.80);

  resize_highlights(params);


  // resize row labels
  ///////////////////////////

  resize_row_labels(params, svg_group); 
  resize_row_viz(params, svg_group);

  svg_group.selectAll('.row_label_text')
    .select('text')
    .style('font-size', params.labels.default_fs_row + 'px')
    .text(function(d){ return normal_name(params, d);});

  // change the size of the highlighting rects
  svg_group.selectAll('.row_label_text')
    .each(function() {
      var bbox = d3.select(this).select('text')[0][0].getBBox();
      d3.select(this)
        .select('rect')
        .attr('x', bbox.x )
        .attr('y', 0)
        .attr('width', bbox.width )
        .attr('height', params.matrix.rect_height)
        .style('fill', 'yellow')
        .style('opacity', function(d) {
          var inst_opacity = 0;
          // highlight target genes
          if (d.target === 1) {
            inst_opacity = 1;
          }
          return inst_opacity;
        });
    });

  svg_group.selectAll('.row_label_text')
    .select('text')
    .attr('y', params.matrix.rect_height * 0.5 + params.labels.default_fs_row*0.35 ); 

  if (utils.has( params.network_data.row_nodes[0], 'value')) {

    // set bar scale
    var enr_max = Math.abs(_.max( params.network_data.row_nodes, function(d) { return Math.abs(d.value); } ).value) ;

    params.labels.bar_scale_row = d3.scale
      .linear()
      .domain([0, enr_max])
      .range([0, params.norm_label.width.row ]);

    svg_group.selectAll('.row_bars')
      .attr('width', function(d) {
        var inst_value = 0;
        inst_value = params.labels.bar_scale_row( Math.abs(d.value) );
        return inst_value;
      })
      .attr('x', function(d) {
        var inst_value = 0;
        inst_value = -params.labels.bar_scale_row( Math.abs(d.value) );
        return inst_value;
      })
      .attr('height', params.matrix.rect_height );

  }

  svg_group
    .selectAll('.row_viz_group')
    .attr('transform', function(d) {
        var inst_index = _.indexOf(row_nodes_names, d.name);
        return 'translate(0, ' + params.matrix.y_scale(inst_index) + ')';
      });

  svg_group
    .selectAll('.row_viz_group')
    .select('path')
    .attr('d', function() {
      var origin_x = params.class_room.symbol_width - 1;
      var origin_y = 0;
      var mid_x = 1;
      var mid_y = params.matrix.rect_height / 2;
      var final_x = params.class_room.symbol_width - 1;
      var final_y = params.matrix.rect_height;
      var output_string = 'M ' + origin_x + ',' + origin_y + ' L ' +
        mid_x + ',' + mid_y + ', L ' + final_x + ',' + final_y + ' Z';
      return output_string;
    });    

  resize_col_labels(params, svg_group); 
  resize_col_text(params, svg_group);
  resize_col_triangle(params, svg_group);



  resize_col_hlight(params, svg_group);

  // run for both view update and screen resize 
  bound_label_size(params, svg_group);
  resize_dendro(params, svg_group);
  resize_super_labels(params, svg_group);
  resize_spillover(params, svg_group);

  // specific to screen resize 
  resize_grid_lines(params, svg_group);
  resize_borders(params, svg_group);

  // reset zoom and translate
  params.zoom_behavior
    .scale(1)
    .translate([ params.viz.clust.margin.left, params.viz.clust.margin.top ]);

  d3.select(params.viz.viz_svg).style('opacity',1);
};
