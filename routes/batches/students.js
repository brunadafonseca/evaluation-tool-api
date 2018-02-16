const router = require('express').Router()
const passport = require('../../config/auth')
const { Batch, Student } = require('../../models')

const authenticate = passport.authorize('jwt', { session: false })

const loadBatch = (req, res, next) => {
  const id = req.params.id

  Batch.findById(id)
    .then((batch) => {
      req.batch = batch
      next()
    })
    .catch((error) => next(error))
}

router
  .get('/batches/:id/students', loadBatch, (req, res, next) => {
    if (!req.batch) { return next() }
    const students = req.batch.students

    students.sort((a, b) => {
        const nameA = a.name.toUpperCase()
        const nameB = b.name.toUpperCase()
        if (nameA < nameB) { return -1 }
        if (nameA > nameB) { return 1 }
      })

    res.json(students)
  })

  .get('/batches/:id/students/:student_id', loadBatch, (req, res, next) => {
    if (!req.batch) { return next() }

    const student = req.batch.students.filter(student => {
      return (student._id.toString() === req.params.student_id.toString())
    })[0]

    res.json(student)
  })

  .post('/batches/:id/students', authenticate, loadBatch, (req, res, next) => {
    if (!req.batch) { return next() }

    let newStudent = req.body

    const defaultEvaluation = {
      color: 'orange',
      remark: 'This is a default remark',
      day: new Date()
    }

    newStudent = {...newStudent, evaluations: defaultEvaluation }

    req.batch.students.push(newStudent)

    req.batch.save()
      .then((batch) => {
        req.batch = batch
        next()
      })
      .catch((error) => next(error))
    },
    (req, res, next) => {
      res.json(req.batch)
    })

    .patch('/batches/:id/students/:studentId', authenticate, loadBatch, (req, res, next) => {
      if (!req.batch) { return next() }
      const patchForStudent = req.body

      const updatedStudents = req.batch.students.map(student => {
        if ((student._id).toString() === (req.params.studentId).toString()) {
          return patchForStudent
        }

        return student
      })

      updatedStudents.sort((a, b) => {
          const nameA = a.name.toUpperCase()
          const nameB = b.name.toUpperCase()
          if (nameA < nameB) { return -1 }
          if (nameA > nameB) { return 1 }
        })

      req.batch.students = updatedStudents

      req.batch.save()
        .then((batch) => {
          req.batch = batch
        })

        res.json(req.batch)
    })

  module.exports = router
