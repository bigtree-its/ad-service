module.exports = (app) => {
    const qa = require('../controller/qa.js');
    const { verifyToken } = require('../security/security');
    const { check } = require('express-validator');

    const qaPath = process.env.CONTEXT_PATH + '/qa';
    app.get(qaPath, qa.findQAForProduct);

    // Public routes
    const qPath = process.env.CONTEXT_PATH + '/questions';
    // Retrieve all Quesstions
    app.get(qPath, qa.findAllQ);

    // Retrieve a single Question with Id
    app.get(qPath + '/:id', qa.findOneQ);

    // Private routes
    // Creates a new Question
    app.post(qPath,
        // verifyToken, 
        [
            check('product').exists().isMongoId().withMessage('Product is not valid')
        ],
        qa.createQ);

    // Update a Question with id
    app.put(qPath + '/:id', qa.updateQ);

    // Delete a Question with id
    app.delete(qPath + '/:id', qa.deleteQ);

    //Delete All 
    app.delete(qPath, qa.deleteEverything);



    //Answers
    const aPath = process.env.CONTEXT_PATH + '/answers';
    // Public routes
    // Retrieve all Answers for a Question
    app.get(aPath, qa.findAllA);

    // Retrieve a single Answer with Id
    app.get(aPath + '/:id', qa.findOneA);

    // Private routes
    // Creates a new Answer for a Question
    app.post(aPath,
        // verifyToken, 
        [
            check('question').exists().isUUID().withMessage('Question is not valid')
        ],
        qa.createA);

}