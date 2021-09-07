const { BadRequestError } = require("../expressError");

/** dataToUpdate (Object) provides the data to be iterated over.
 * jsToSql (Object) provides js variable names (camel case) to be converted to sql column names (snake case).
 * 
 * Returns {setCols: "String of columns, separated by commas", values: [Pulled from the object values from dataToUpdate]} */ 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
