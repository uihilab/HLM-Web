/** "The Basic Model Interface (BMI) JavaScript specification."
 * This language specification is derived from the Scientific Interface
 * Definition Language (SIDL) file bmi.sidl located at
 * https://github.com/csdms/bmi.
 * @class BMI
*/


 export default class BMI {

    /**
     * Perform startup tasks for the model.
     * Perform all tasks that take place before entering the model's time
     * loop, including opening files and initializing the model state. Model
     * inputs are read from a text-based configuration file, specified by
     * "config_file".
     * @method initialize
     * @memberof BMI
     * @param {String} config_file - The path to the model configuration file
     */

     initialize(config_file) {
        if (this.constructor == BMI) {
            throw new Error("Object of Abstract Class cannot be created");
        }
    }

    /**
     * Advance model state by one time step.
     * Perform all tasks that take place within one pass through the model's
     * time loop. This typically includes incrementing all of the model's
     * state variables. If the model's state variables don't change in time,
     * then they can be computed by the :func:`initialize` method and this
     * method can return with no action.
     * @method update
     * @memberof BMI
     */

    update() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Advance model state until the given time.
     * @method update_until
     * @memberof BMI
     * @param {Number} time - A model time later than the current model time.
     */

    update_until(time) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Perform tear-down tasks for the model.
     * Perform all tasks that take place after exiting the model's time
     * loop. This typically includes deallocating memory, closing files and
     * printing reports.
     * @method finalize
     * @memberof BMI
     */

    finalize() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Gets name of the component.
     * @method get_component_name
     * @memberof BMI
     * @return {String} - The name of the component
     */

    get_component_name() {
       
    }

    /**
     * Count of a model's input variables.
     * @method get_input_item_count
     * @memberof BMI
     * @return {Number} - The number of input variables.
     */

    get_input_item_count() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Count of a model's output variables.
     * @method get_output_item_count
     * @memberof BMI
     * @return {Number} - The number of output variables.
     */

    get_output_item_count() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get grid identifier for the given variable.
     * @method get_var_grid
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - The grid identifier.
     */

    get_var_grid(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get data type of the given variable.
     * @method get_var_type
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {String} - The variable type; e.g., "str", "int", "float".
     */

    get_var_type(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     *  Get units of the given variable.
     *  Standard unit names, in lower case, should be used, such as
     *  "meters" or "seconds". Standard abbreviations, like "m" for
     *  meters, are also supported. For variables with compound units,
     *  each unit name is separated by a single space, with exponents
     *  other than 1 placed immediately after the name, as in "m s-1"
     *  for velocity, "W m-2" for an energy flux, or "km2" for an
     *  area.
     * @method get_var_units
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {String} - The variable units.
     */

    get_var_units(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get memory use for each array element in bytes
     * @method get_var_itemsize
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - Item size in bytes.
     */

    get_var_itemsize(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get size, in bytes, of the given variable
     * @method get_var_nbytes
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - The size of the variable, counted in bytes.
     */

    get_var_nbytes(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the grid element type that the a given variable is defined on.
     * The grid topology can be composed of *nodes*, *edges*, and *faces*.
     * *node*
     *     A point that has a coordinate pair or triplet: the most
     *     basic element of the topology.
     * *edge*
     *     A line or curve bounded by two *nodes*.
     * *face*
     *     A plane or surface enclosed by a set of edges. In a 2D
     *     horizontal application one may consider the word “polygon”,
     *     but in the hierarchy of elements the word “face” is most common.
     * @method get_var_location
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {String} - The grid location on which the variable is defined. Must be one of "node", "edge", or "face".
     */

    get_var_location(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Current time of the model
     * @method current_time
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Number} - The current model time.
     */

    get_current_time() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Start time of the model. Model times should be of type float
     * @method start_time
     * @memberof BMI
     * @return {Number} -The model start time.
     */

    get_start_time() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * End time of the model
     * @method end_time
     * @memberof BMI
     * @return {Number} -The maximum model time.
     */

    get_end_time() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Time units of the model
     * @method time_units
     * @memberof BMI
     * @return {String} -The model time unit; e.g., 'days' or 's'.
     */

    get_time_units() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Current time step of the model. The model time step should be of type float
     * @method time_step
     * @memberof BMI
     * @return {Number} -The time step used in model.
     */

    get_time_step() {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     *  Get a copy of values of the given variable.
     *  This is a method for the model, used to access the model's
     *  current state. It returns a *copy* of a model variable, with
     *  the return type, size and rank dependent on the variable.
     * @method get_value
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} dest - A array into which to place the values
     * @return {Object[]} -The same numpy array that was passed as an input buffer.
     */

    get_value(name, dest) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     *  Get a reference to values of the given variable.
     *  This is a method for the model, used to access the model's
     *  current state. It returns a reference to a model variable,
     *  with the return type, size and rank dependent on the variable.
     * @method get_value_ptr
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @return {Object[]} -A reference to a model variable.
     */

    get_value_ptr(name) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get values at particular indices.
     * @method get_value_at_indices
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} dest - A numpy array into which to place the values
     * @param {Object[]} inds - The indices into the variable array
     * @return {Object[]} -Value of the model variable at the given location.
     */

    get_value_at_indices(name, dest, inds) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Specify a new value for a model variable.
     * This is the setter for the model, used to change the model's
     * current state. It accepts, through *src*, a new value for a
     * model variable, with the type, size and rank of *src*
     * dependent on the variable.
     * @method set_value
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} src - The new value for the specified variable
     */

    set_value(name, src) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Specify a new value for a model variable at particular indices.
     * @method set_value_at_indices
     * @memberof BMI
     * @param {String} name - An input or output variable name, a CSDMS Standard Name
     * @param {Object[]} inds - The indices into the variable array
     * @param {Object[]} src - The new value for the specified variable
     */

    set_value_at_indices(name, inds, src) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get number of dimensions of the computational grid.
     * @method get_grid_rank
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} Rank of the grid.
     */

    get_grid_rank(grid) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the total number of elements in the computational grid.
     * @method get_grid_size
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} Size of the grid.
     */

    get_grid_size(grid) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the grid type as a string.
     * @method get_grid_type
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {String} Type of grid as a string.
     */

    get_grid_type(grid) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get dimensions of the computational grid
     * @method get_grid_shape
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ndim,)*} shape - A numpy array into which to place the shape of the grid.
     * @return {Object[] of Number} The input numpy array that holds the grid's shape.
     */

    get_grid_shape(grid, shape) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get dimensions of the computational grid
     * @method get_grid_spacing
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ndim,)*} spacing - A numpy array to hold the spacing between grid rows and columns.
     * @return {Object[] of Number} The input numpy array that holds the grid's spacing.
     */

    get_grid_spacing(grid, spacing) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get coordinates for the lower-left corner of the computational grid.
     * @method get_grid_origin
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ndim,)*} origin - A numpy array to hold the coordinates of the lower-left corner of the grid.
     * @return {Object[] of Number} The input numpy array that holds the coordinates of the grid's lower-left corner.
     */

    get_grid_origin(grid, origin) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get coordinates of grid nodes in the x direction.
     * @method get_grid_x
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(nrows,)*} x - A numpy array to hold the x-coordinates of the grid node columns
     * @return {Object[] of Number} The input numpy array that holds the grid's column x-coordinates.
     */

    get_grid_x(grid, x) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get coordinates of grid nodes in the y direction.
     * @method get_grid_y
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(ncols,)*} y - A numpy array to hold the y-coordinates of the grid node rows
     * @return {Object[] of Number} The input numpy array that holds the grid's row y-coordinates
     */

    get_grid_y(grid, y) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get coordinates of grid nodes in the z direction.
     * @method get_grid_z
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(nlayers,)*} z - A numpy array to hold the z-coordinates of the grid nodes layers.
     * @return {Object[] of Number} The input numpy array that holds the grid's layer z-coordinates.
     */

    get_grid_z(grid, z) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the number of nodes in the grid.
     * @method get_grid_node_count
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} The total number of grid nodes
     */

    get_grid_node_count(grid) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the number of edges in the grid
     * @method get_grid_edge_count
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} The total number of grid edges
     */

    get_grid_edge_count(grid) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the number of faces in the grid.
     * @method get_grid_face_count
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @return {Number} The total number of grid faces.
     */

    get_grid_face_count(grid) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the edge-node connectivity.
     * @method get_grid_edge_nodes
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(2 x nnodes,)*} edge_nodes - A numpy array to place the edge-node connectivity. For each edge, connectivity is given as node at edge tail, followed by node at edge head.
     * @return {Object[] of Number} The input numpy array that holds the edge-node connectivity.
     */

    get_grid_edge_nodes(grid, edge_nodes) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the face-edge connectivity.
     * @method get_grid_face_edges
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number} face_edges - A numpy array to place the face-edge connectivity.
     * @return {Object[] of Number} The input numpy array that holds the face-edge connectivity.
     */

    get_grid_face_edges(grid, face_edges) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the face-edge connectivity.
     * @method get_grid_face_nodes
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number} face_nodes - A numpy array to place the face-node connectivity. For each face, the nodes (listed in a counter-clockwise direction) that form the boundary of the face.
     * @return {Object[] of Number} The input numpy array that holds the face-node connectivity.
     */

    get_grid_face_nodes(grid, face_nodes) {
        throw new Error("Abstract Method has no implementation");
    }

    /**
     * Get the face-edge connectivity.
     * @method get_grid_nodes_per_face
     * @memberof BMI
     * @param {Number} grid - A grid identifier
     * @param {Object[] of Number, shape *(nfaces,)*} nodes_per_face - A numpy array to place the number of nodes per face.
     * @return {Object[] of Number} The input numpy array that holds the number of nodes per face.
     */

    get_grid_nodes_per_face(grid, nodes_per_face) {
        throw new Error("Abstract Method has no implementation");
    }

}
