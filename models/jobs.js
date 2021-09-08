'use strict'

const db = require('../db')
const { NotFoundError } = require('../expressError')
const { sqlForPartialUpdate, sqlJobFilter } = require('../helpers/sql')

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ($1, $2, $3, $4)
      RETURNING id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    )
    const job = result.rows[0]

    return job
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * 
   * Allows for filter: hasEquity must be last in filterData.
   * */

  static async findAll(filterData) {
    // Verifies that filterData is defined and has keys/values and returns a query based on given filterData criteria.
    // If not it will run a general query of all companies.
    const isAndHasKeys =
      filterData !== undefined && !!Object.keys(filterData).length
    if (isAndHasKeys) {
      const { whereCriteria, values } = sqlJobFilter(filterData)

      const filtJobRes = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
          FROM jobs
          WHERE ${whereCriteria}
          ORDER BY id`,
        [...values]
      )
      return filtJobRes.rows
    }
    const jobsRes = await db.query(`
      SELECT id, title, salary, equity, company_handle AS "companyHandle" 
      FROM jobs
      ORDER BY id`)
    return jobsRes.rows
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `
      SELECT j.id,
             j.title,
             j.salary,
             j.equity,
             j.company_handle AS "companyHandle",
             c.handle,
             c.name,
             c.description,
             c.num_employees AS "numEmployees",
             c.logo_url AS "logoUrl"
      FROM jobs AS j
        JOIN companies AS c ON j.company_handle = c.handle
      WHERE j.id = $1`,
      [id]
    )

    const job = jobRes.rows[0]

    if (!job) throw new NotFoundError(`No job: ${id}`)

    const jobObj = {
      id: job.id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      company: {
        handle: job.handle,
        name: job.name,
        description: job.description,
        numEmployees: job.numEmployees,
        logoUrl: job.logoUrl,
      },
    }

    return jobObj
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Will not change the id or company associated.
   * 
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {})
    const handleVarIdx = '$' + (values.length + 1)

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`
    const result = await db.query(querySql, [...values, id])
    const job = result.rows[0]

    if (!job) throw new NotFoundError(`No job: ${id}`)

    return job
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
      FROM jobs
      WHERE id = $1
      RETURNING id`,
      [id]
    )
    const job = result.rows[0]

    if (!job) throw new NotFoundError(`No job: ${id}`)
  }
}

module.exports = Job
