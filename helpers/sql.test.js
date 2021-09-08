const { sqlForPartialUpdate, sqlCompanyFilter, sqlJobFilter } = require('./sql')

describe('Tests for sqlForPartialUpdate', () => {
  test('converts data to sql query', () => {
    const data = { testColumn: 'test' }
    const result = sqlForPartialUpdate(data, {
      testColumn: 'test_column',
    })
    expect(result).toEqual({
      setCols: '"test_column"=$1',
      values: ['test'],
    })
  })
})

describe('Tests for sqlCompanyFilter', () => {
  test('converts supplied data to SQL WHERE statement and values', () => {
    const data = { name: 'Comp', minEmployees: 32, maxEmployees: 50 }
    const result = sqlCompanyFilter(data)

    expect(result).toEqual({
      whereCriteria:
        `upper(name) LIKE upper('%' || $1 || '%') AND "num_employees">=$2 AND "num_employees"<=$3`,
      values: ['Comp', 32, 50],
    })
  })

  test('accepts two filter parameters', () => {
    const data = { name: 'Comp', minEmployees: 32 }
    const result = sqlCompanyFilter(data)

    expect(result).toEqual({
      whereCriteria:
        `upper(name) LIKE upper('%' || $1 || '%') AND "num_employees">=$2`,
      values: ['Comp', 32],
    })
  })

  test('accepts one filter parameters', () => {
    const data = { name: 'Comp' }
    const result = sqlCompanyFilter(data)

    expect(result).toEqual({
      whereCriteria: `upper(name) LIKE upper('%' || $1 || '%')`,
      values: ['Comp'],
    })
  })

  test('throws error if minEmployees > maxEmployees', () => {
    const data = { minEmployees: 50, maxEmployees: 49 }

    expect((data) => sqlForFilter(data)).toThrow(Error)
  })
})

describe('Tests for sqlJobFilter', () => {
  test('converts supplied data to SQL WHERE statement and values', () => {
    const data = { title: 'Comp', minSalary: 50000, hasEquity: true }
    const result = sqlJobFilter(data)

    expect(result).toEqual({
      whereCriteria: `upper(title) LIKE upper('%' || $1 || '%') AND "salary">=$2 AND "equity">0`,
      values: ['Comp', 50000],
    })
  })

  test('accepts two filter parameters', () => {
    const data = { title: 'Comp', minSalary: 50000 }
    const result = sqlJobFilter(data)

    expect(result).toEqual({
      whereCriteria: `upper(title) LIKE upper('%' || $1 || '%') AND "salary">=$2`,
      values: ['Comp', 50000],
    })
  })

  test('does not accepts hasEquity first', () => {
    const data = { hasEquity: true, minSalary: 50000 }
    const result = sqlJobFilter(data)

    expect(result).not.toEqual({
      whereCriteria: `"equity">0 AND "salary">=$1`,
      values: [50000],
    })
  })

  test('accepts one filter parameters', () => {
    const data = { title: 'Comp' }
    const result = sqlJobFilter(data)

    expect(result).toEqual({
      whereCriteria: `upper(title) LIKE upper('%' || $1 || '%')`,
      values: ['Comp'],
    })
  })

  test('accepts hasEquity as solo filter parameters', () => {
    const data = { hasEquity: true }
    const result = sqlJobFilter(data)

    expect(result).toEqual({
      whereCriteria: `"equity">0`,
      values: [],
    })
  })
})