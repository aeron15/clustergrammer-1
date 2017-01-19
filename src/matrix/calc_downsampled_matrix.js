module.exports = function make_ds_matrix(params){

  var ds_num = 10;

  var mod_val = params.viz.clust.dim.height / ds_num;

  console.log(mod_val)

  var mat = params.matrix.matrix;

  // var ds_mat = mat;

  var ds_mat = [];
  var inst_obj;

  // initialize array of objects
  for (var i=0; i < ds_num+1; i++){

    inst_obj = {};
    inst_obj.row_index = i;
    inst_obj.name = String(i);

    ds_mat.push(inst_obj);
  }

  _.each(mat, function(inst_row){
    // console.log(inst_row)

    var inst_y = params.viz.y_scale(inst_row.row_index);

    var ds_index = Math.round(inst_y/mod_val);

    var inst_row_data = inst_row.row_data;

    // gather names
    if (_.has(ds_mat[ds_index], 'all_names')){
      ds_mat[ds_index].all_names.push(inst_row.name);
    } else {
      ds_mat[ds_index].all_names = [inst_row.name];
    }

    // gather row_data
    if (_.has(ds_mat[ds_index], 'row_data')){

      // var old_data = ds_mat[ds_index].row_data;

      for (var i=0; i < inst_row_data.length; i++){

        ds_mat[ds_index].row_data[i].value = ds_mat[ds_index].row_data[i].value + inst_row_data[i].value;
      }


    } else {

      for (var i=0; i < inst_row_data.length; i++){
        new_data[i] = {};
        new_data[i].value = inst_row_data[i].value;
      }

      ds_mat[ds_index].row_data = new_data

    }

  })

  console.log(ds_mat)

  // all names were found
  var all_names = [];

  _.each(ds_mat, function(inst_row){
    all_names = all_names.concat(inst_row.all_names)
  })

  console.log(all_names.length)

  return ds_mat;

};