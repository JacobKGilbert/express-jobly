'use strict'

const db = require('../db')
const { BadRequestError, NotFoundError } = require('../expressError')
const Job = require('./jobs')
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require('./_testCommon')

beforeAll(commonBeforeAll)
beforeEach(commonBeforeEach)
afterEach(commonAfterEach)
afterAll(commonAfterAll)

/************************************** create */

describe('create', function () {
  const newJob = {
    title: 'new job',
    salary: 1000,
    equity: 0.25,
    companyHandle: 'c2'
  }

  test('works', async function () {
    let job = await Job.create(newJob)
    expect(job).toEqual({
      id: expect.any(Number),
      title: newJob.title,
      salary: newJob.salary,
      equity: `${newJob.equity}`,
      companyHandle: newJob.companyHandle
    })

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE title = 'new job'`
    )
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: 'new job',
        salary: 1000,
        equity: '0.25',
        companyHandle: 'c2',
      },
    ])
  })
})

/************************************** findAll */

describe('findAll', function () {
  test('works: no filter', async function () {
    let jobs = await Job.findAll()
    expect(jobs).toEqual([
      {
        id: 1,
        title: 'test job',
        salary: 10000,
        equity: '0',
        companyHandle: 'c1'
      },
      {
        id: 2,
        title: 'second job',
        salary: 5000,
        equity: '0.5',
        companyHandle: 'c3'
      }
    ])
  })

  test('works: with filter: hasEquity', async () => {
    let filterData = { hasEquity: true }
    let jobs = await Job.findAll(filterData)
    expect(jobs).toEqual([
      {
        id: 2,
        title: 'second job',
        salary: 5000,
        equity: '0.5',
        companyHandle: 'c3',
      },
    ])
  })

  test('works: with filter: minSalary', async () => {
    let filterData = { minSalary: 7500 }
    let jobs = await Job.findAll(filterData)
    expect(jobs).toEqual([
      {
        id: 1,
        title: 'test job',
        salary: 10000,
        equity: '0',
        companyHandle: 'c1',
      },
    ])
  })

  test('works: with filter: title', async () => {
    let filterData = { title: 'ond' }
    let jobs = await Job.findAll(filterData)
    expect(jobs).toEqual([
      {
        id: 2,
        title: 'second job',
        salary: 5000,
        equity: '0.5',
        companyHandle: 'c3',
      },
    ])
  })
})

/************************************** get */

describe('get', function () {
  test('works', async function () {
    let job = await Job.get(1)
    expect(job).toEqual({
      id: 1,
      title: 'test job',
      salary: 10000,
      equity: '0',
      company: {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img',
      },
    })
  })

  test('not found if no such job', async function () {
    try {
      await Job.get(0)
      fail()
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })
})

/************************************** update */

describe('update', function () {
  const updateData = {
    title: 'updated job',
    salary: 15000,
    equity: 0.15
  }

  test('works', async function () {
    let job = await Job.update(2, updateData)
    expect(job).toEqual({
      id: 2,
      title: 'updated job',
      salary: 15000,
      equity: '0.15',
      companyHandle: 'c3'
    })

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id = 2`
    )
    expect(result.rows).toEqual([
      {
        id: 2,
        title: 'updated job',
        salary: 15000,
        equity: '0.15',
        companyHandle: 'c3',
      },
    ])
  })

  test('works: null fields', async function () {
    const updateDataSetNulls = {
      title: 'updated job',
      salary: null,
      equity: null,
    }

    let job = await Job.update(1, updateDataSetNulls)
    expect(job).toEqual({
      id: 1,
      companyHandle: 'c1',
      ...updateDataSetNulls,
    })

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id = 1`
    )
    expect(result.rows).toEqual([
      {
        id: 1,
        title: 'updated job',
        salary: null,
        equity: null,
        companyHandle: 'c1'
      },
    ])
  })

  test('not found if no such job', async function () {
    try {
      await Job.update(0, updateData)
      fail()
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })

  test('bad request with no data', async function () {
    try {
      await Job.update(1, {})
      fail()
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  })
})

/************************************** remove */

describe('remove', function () {
  test('works', async function () {
    await Job.remove(2)
    const res = await db.query("SELECT id FROM jobs WHERE id=2")
    expect(res.rows.length).toEqual(0)
  })

  test('not found if no such job', async function () {
    try {
      await Job.remove(0)
      fail()
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy()
    }
  })
})
