'use strict'

/** Routes for jobs. */

const jsonschema = require('jsonschema')
const express = require('express')

const { BadRequestError } = require('../expressError')
const {
  ensureLoggedIn,
  ensureIsAdminOrCurrentUser,
} = require('../middleware/auth')
const Job = require('../models/jobs')

const jobNewSchema = require('../schemas/jobNew.json')
const jobUpdateSchema = require('../schemas/jobUpdate.json')

const router = new express.Router()

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login, isAdmin
 */

router.post('/', ensureLoggedIn, ensureIsAdminOrCurrentUser, 
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema)
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack)
        throw new BadRequestError(errs)
      }

      const job = await Job.create(req.body)
      return res.status(201).json({ job })
    } catch (err) {
      return next(err)
    }
  }
)

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get('/', async function (req, res, next) {
  try {
    const jobs = await Job.findAll(req.body)
    return res.json({ jobs })
  } catch (err) {
    return next(err)
  }
})

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, company }
 *   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 */

router.get('/:id', async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id)
    return res.json({ job })
  } catch (err) {
    return next(err)
  }
})

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, isAdmin
 */

router.patch('/:id', ensureLoggedIn, ensureIsAdminOrCurrentUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema)
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack)
        throw new BadRequestError(errs)
      }

      const job = await Job.update(req.params.id, req.body)
      return res.json({ job })
    } catch (err) {
      return next(err)
    }
  }
)

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login, isAdmin
 */

router.delete('/:id', ensureLoggedIn, ensureIsAdminOrCurrentUser,
  async function (req, res, next) {
    try {
      await Job.remove(req.params.id)
      return res.json({ deleted: req.params.id })
    } catch (err) {
      return next(err)
    }
  }
)

module.exports = router