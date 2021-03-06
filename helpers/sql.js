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

/** Given filterData return formatted string for WHERE statement in SQL query */
function sqlCompanyFilter(filterData) {
  // Checks for both min and max employees and then checks that max is not less than min. If so, throws error.
  if (filterData['minEmployees'] && filterData['maxEmployees']) {
    if (filterData['maxEmployees'] < filterData['minEmployees']) {
      throw new BadRequestError(
        'Max employees must be greater than Min employees'
      )
    }
  }
  // {name: 'Comp', minEmployees: 32, maxEmployees: 50} =>
  // ['"NAME" LIKE "%$1%"', '"num_employees">=$2', '"num_employees"<=$3']
  const keys = Object.keys(filterData)
  const cols = keys.map((colName, idx) => {
    if (colName === 'minEmployees') {
      return `"num_employees">=$${idx + 1}`
    } else if (colName === 'maxEmployees') {
      return `"num_employees"<=$${idx + 1}`
    } else if (colName === 'name') {
    return `upper(${colName}) LIKE upper('%' || $${idx + 1} || '%')`
    }
  })

  return {
    // whereCriteria:
    // '"NAME" LIKE "%$1%" AND "num_employees"<=$2 AND "num_employees">=$3'
    whereCriteria: cols.join(' AND '),
    values: Object.values(filterData),
  }
}

/** Given filterData return formatted string for WHERE statement in SQL query */
function sqlJobFilter(filterData) {
  // hasEquity MUST BE LAST!!!
  // {title: 'Comp', minSalary: 50000, hasEquity: true} =>
  // ['"TITLE" LIKE "%$1%"', '"salary">=$2', '"equity">0']
  const keys = Object.keys(filterData)
  const values = Object.values(filterData)

  const cols = keys.map((colName, idx) => {
    if (colName === 'minSalary') {
      return `"salary">=$${idx + 1}`
    } else if (colName === 'title') {
    return `upper(${colName}) LIKE upper('%' || $${idx + 1} || '%')`
    } else if (colName === 'hasEquity') {
      // We do not want a boolean in the values passed to the query. This will remove the boolean no matter true or false. 
      values.splice(idx, 1)

      if (filterData['hasEquity'] === true) {
        return `"equity">0`
      } else {
        return ''
      }
    }
  })

  return {
    // whereCriteria:
    // '"NAME" LIKE "%$1%" AND "num_employees"<=$2 AND "num_employees">=$3'
    whereCriteria: cols.join(' AND '),
    values: values,
  }
}

module.exports = { sqlForPartialUpdate, sqlCompanyFilter, sqlJobFilter };
