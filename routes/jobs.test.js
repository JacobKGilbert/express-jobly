'use strict'

const request = require('supertest')

const db = require('../db')
const app = require('../app')

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
} = require('./_testCommon')

let testJob

beforeAll(async () => {testJob = await commonBeforeAll()})
beforeEach(commonBeforeEach)
afterEach(commonAfterEach)
afterAll(commonAfterAll)

/************************************** POST /companies */

describe('POST /jobs', function () {
  const newJob = {
    title: 'new job',
    salary: 1000,
    equity: 0.0,
    companyHandle: 'c2',
  }

  test('works for admin', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: 'new job',
        salary: 1000,
        equity: '0',
        companyHandle: 'c2'
      }
    })
  })

  test('fails for user', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('bad request with missing data', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({
        title: 'new job',
        salary: 1000,
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('bad request with invalid data', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({
        title: 'new job',
        salary: 1000,
        equity: 0.0,
        companyHandle: 2,
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(400)
  })
})

/************************************** GET /companies */

describe('GET /jobs', function () {
  test('works for anon', async function () {
    const resp = await request(app).get('/jobs')
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: 'test job',
          salary: 10000,
          equity: '0',
          companyHandle: 'c1',
        },
        {
          id: expect.any(Number),
          title: 'second job',
          salary: 5000,
          equity: '0.5',
          companyHandle: 'c3',
        },
      ],
    })
  })

  // test('works with filter', async () => {
  //   const data = { name: 'C', minEmployees: 2 }
  //   const resp = await request(app).get('/companies').send(data)

  //   expect(resp.body).toEqual({
  //     companies: [
  //       {
  //         handle: 'c2',
  //         name: 'C2',
  //         description: 'Desc2',
  //         numEmployees: 2,
  //         logoUrl: 'http://c2.img',
  //       },
  //       {
  //         handle: 'c3',
  //         name: 'C3',
  //         description: 'Desc3',
  //         numEmployees: 3,
  //         logoUrl: 'http://c3.img',
  //       },
  //     ],
  //   })
  // })

  test('fails: test next() handler', async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query('DROP TABLE jobs CASCADE')
    const resp = await request(app)
      .get('/jobs')
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(500)
  })
})

/************************************** GET /companies/:handle */

describe('GET /jobs/:id', function () {
  test('works for anon', async function () {
    const resp = await request(app).get(`/jobs/${testJob.id}`)
    expect(resp.body).toEqual({
      job: {
        id: testJob.id,
        title: testJob.title,
        salary: testJob.salary,
        equity: testJob.equity,
        company: {
          handle: 'c1',
          name: 'C1',
          description: 'Desc1',
          numEmployees: 1,
          logoUrl: 'http://c1.img',
        },
      },
    })
  })

  test('not found for no such job', async function () {
    const resp = await request(app).get(`/jobs/0`)
    expect(resp.statusCode).toEqual(404)
  })
})

/************************************** PATCH /companies/:handle */

describe('PATCH /jobs/:id', function () {
  test('works for admin', async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        salary: 15000,
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.body).toEqual({
      job: {
        id: testJob.id,
        title: 'test job',
        salary: 15000,
        equity: '0',
        companyHandle: 'c1',
      },
    })
  })

  test('fails for user', async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        salary: 15000,
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toBe(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).patch(`/jobs/${testJob.id}`).send({
      salary: 15000,
    })
    expect(resp.statusCode).toEqual(401)
  })

  test('not found on no such company', async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        salary: 15000,
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(404)
  })

  test('bad request on companyHandle change attempt', async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        companyHandle: 'c1-new',
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('bad request on invalid data', async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        salary: 'Money!!!',
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(400)
  })
})

/************************************** DELETE /companies/:handle */

describe('DELETE /jobs/:id', function () {
  test('works for admin', async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.body).toEqual({ deleted: `${ testJob.id }` })
  })

  test('fails for user', async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toBe(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).delete(`/jobs/${testJob.id}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('not found for no such job', async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.statusCode).toEqual(404)
  })
})
