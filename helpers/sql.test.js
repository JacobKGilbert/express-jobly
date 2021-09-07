const { sqlForPartialUpdate } = require('./sql')

test('converts data to sql query', () => {
  const data = { testColumn: 'test' }
  const result = sqlForPartialUpdate(
    data,
    {
      testColumn: "test_column",
    })
  expect(result).toEqual({
    setCols: '\"test_column\"=$1',
    values: ['test'],
  })
})