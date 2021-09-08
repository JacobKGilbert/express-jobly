"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
} = require("./_testCommon");

let testJob

beforeAll(async () => { testJob = await commonBeforeAll() });
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admin: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-new",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test('fails for user: create non-admin', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        password: 'password-new',
        email: 'new@email.com',
        isAdmin: false,
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test("works for admin: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-new",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test('fails for user: create admin', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-new',
        password: 'password-new',
        email: 'new@email.com',
        isAdmin: true,
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("admin: bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("admin: bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-new",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "a1",
          firstName: "A1F",
          lastName: "A1L",
          email: "admin@admin.com",
          isAdmin: true,
        },
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("fails for user", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test('works for admin', async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false,
      },
    })
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test('works for admin', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 'New',
      })
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'New',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false,
      },
    })
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("admin: bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('user: bad request if invalid data', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42,
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(400)
  })

  test("works for admin: set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  test('works for user: set new password', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: 'new-password',
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false,
      },
    })
    const isSuccessful = await User.authenticate('u1', 'new-password')
    expect(isSuccessful).toBeTruthy()
  })
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test('works for users', async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set('authorization', `Bearer ${a1Token}`)
    expect(resp.body).toEqual({ deleted: 'u1' })
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /users/:username/jobs/:id */

describe('POST /users/:username/jobs/:id', () => {
  test('works for admin', async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJob.id}`)
      .set('authorization', `Bearer ${a1Token}`)

    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({ applied: `${testJob.id}` })
  })

  test('works for user', async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJob.id}`)
      .set('authorization', `Bearer ${u1Token}`)

    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({ applied: `${testJob.id}` })
  })

  test('unauth for anon', async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJob.id}`)

    expect(resp.statusCode).toEqual(401)
  })

  test('not found if user missing', async () => {
    const resp = await request(app)
      .post(`/users/nope/jobs/${testJob.id}`)
      .set('authorization', `Bearer ${a1Token}`)

    expect(resp.statusCode).toEqual(404)
  })

  test('not found if job missing', async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/0`)
      .set('authorization', `Bearer ${a1Token}`)

    expect(resp.statusCode).toEqual(404)
  })
})