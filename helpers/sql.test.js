const { sqlForPartialUpdate, sqlForFilter } = require('./sql')

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

describe('Tests for sqlForFilter', () => {
  test('converts supplied data to SQL WHERE statement and values', () => {
    const data = { name: 'Comp', minEmployees: 32, maxEmployees: 50 }
    const result = sqlForFilter(data)

    expect(result).toEqual({
      whereCriteria:
        '"name" LIKE "%$1%" AND "num_employees"<=$2 AND "num_employees">=$3',
      values: ['Comp', 32, 50],
    })
  })

  test('accepts two filter parameters', () => {
    const data = { name: 'Comp', minEmployees: 32 }
    const result = sqlForFilter(data)

    expect(result).toEqual({
      whereCriteria:
        '"name" LIKE "%$1%" AND "num_employees"<=$2',
      values: ['Comp', 32],
    })
  })

  test('accepts one filter parameters', () => {
    const data = { name: 'Comp' }
    const result = sqlForFilter(data)

    expect(result).toEqual({
      whereCriteria: '"name" LIKE "%$1%"',
      values: ['Comp'],
    })
  })

  test('throws error if minEmployees > maxEmployees', () => {
    const data = { minEmployees: 50, maxEmployees: 49 }

    expect((data) => sqlForFilter(data)).toThrow(Error)
  })
})

