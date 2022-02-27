
// Require Question Model
const Question = require('../model/property-enquiry');
const Answer = require('../model/answer');
const Product = require('../model/product');
// const { ProductQA, Q, A } = require('../model/product-qa');

// Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Mongoose
var mongoose = require('mongoose');

// Require Validation Utils
const { validationResult, errorFormatter } = require('./validation');


exports.findQAForProduct = (req, res) => {
    console.log(`Finding questions and aswers for Product ${req.query.product}`);
    var productQA = { product: "", questions: [] };

    if (req.query.product) {
        productQA.product = req.query.product;
        productQA.questions = [];
        var qQuery = Question.find();
        qQuery.where("product").equals(req.query.product);
        Question.find(qQuery).sort({ date: -1 })
            .then(questionsFound => {
                if (questionsFound && questionsFound.length > 0) {
                    var countDown = questionsFound.length;
                    console.log(`Found ${questionsFound.length} questions for product ${req.query.product}.`);
                    questionsFound.forEach(question => {

                        var q = {
                            id: question._id,
                            question: question.question,
                            date: question.date,
                            userEmail: question.userEmail,
                            userName: question.userName,
                            answers: []
                        }
                        productQA.questions.push(q);
                        console.log(`Finding answers for Question ${q.id}.`);
                        var ansQuery = Answer.find();
                        ansQuery.where("question").equals(q.id);
                        Answer.find(ansQuery).sort({ date: -1 })
                            .then(answerResult => {
                                if (answerResult && answerResult.length > 0) {
                                    console.log(`Found ${answerResult.length} answers for question ${question._id}`);
                                    answerResult.forEach(answer => {

                                        var a = {
                                            id: answer._id,
                                            answer: answer.answer,
                                            date: answer.date,
                                            userEmail: answer.userEmail,
                                            userName: answer.userName
                                        }
                                        q.answers.push(a);
                                    });
                                    countDown = countDown - 1;
                                    if (countDown == 0) {
                                        res.send(productQA);
                                    }
                                } else {
                                    countDown = countDown - 1;
                                    console.log(`Found no answers for Question ${question._id}`);
                                    if (countDown == 0) {
                                        res.send(productQA);
                                    }
                                }
                            }).catch(err => {
                                countDown = countDown - 1;
                                console.log(`Found no answers for Question ${question._id}. Error: ${err}`);
                                if (countDown == 0) {
                                    res.send(productQA);
                                }
                            });
                    });
                } else {
                    console.log(`Found no Questions for product ${req.query.product}`);
                    res.send(productQA);
                }
            }).catch(err => {
                console.log(`Error while looking for question for the product ${req.query.product}`);
                res.status(500).send(productQA)
            });
    } else {
        return res.json({});
    }
}

// Deletes all
exports.deleteEverything = (req, res) => {
    Question.remove().then(result => {
        res.send({ message: "Deleted all Questions" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Questions. ${err.message}`
        });
    });
};

// Create and Save a new Question
exports.createQ = (req, res) => {

    console.log("Creating new Question " + JSON.stringify(req.body));

    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);

    if (!errors.isEmpty()) {
        var err = _.uniq(errors.array());
        console.log('Cannot create question: ' + err);
        return res.json({ errors: err });
    }
    Product.findById(req.body.product)
        .then(Product => {
            if (!Product) {
                console.error(`Cannot create a question for product: ${req.body.product}. Product not found`);
                return res.status(404).send({ message: `Product not found ${req.body.product}` });
            }
            duplicateCheckAndPersistQ(req, res);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                console.error(`Cannot create a question for product: ${req.body.product}. Product not found`);
                return res.status(404).send({ message: `Product not found ${req.body.product}` });
            }
            console.error(`Cannot create a question for product: ${req.body.product}`);
            return res.status(500).send({ message: `Error while creating Question` });
        });
};

function duplicateCheckAndPersistQ(req, res) {

    console.log(`Checking if a question already exist for product ${req.body.product}`);

    Question.exists({ question: req.body.question, product: req.body.product }, function (err, result) {
        if (err) {
            console.error(`Cannot create a question for product: ${req.body.product}`);
            return res.status(500).send({ message: `Error while finding Question for product:${req.body.product}` });
        } else if (result) {
            console.error(`Question already exist for Product:${req.body.product}`);
            res.status(400).send({ message: `You have already posted this question for this product` });
        } else {
            persistQ(req, res);
        }
    });
}

// Retrieve and return all Questions from the database.
exports.findAllQ = (req, res, next) => {

    var query = Question.find();

    if (req.query.product) {
        query.where("product").equals(req.query.product);
    }

    if (req.query.userEmail) {
        query.where("userEmail").equals(req.query.userEmail);
    }

    Question.find(query).sort({ date: -1 }).then(result => {
        if (result) {
            console.log(`Returning ${result.length} questions.`);
            res.send(result);
        } else {
            console.log("Returning no Questions");
            res.send({});
        }
    }).catch(err => { res.status(500).send({ message: err.message }) });
};

// Find a single Question with a ID
exports.findOneQ = (req, res) => {

    Question.findById(req.params.id)
        .then(Question => {
            if (!Question) {
                return res.status(404).send({ message: `Question not found with id ${req.params.id}` });
            }
            res.send(Question);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Question not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error while retrieving Question with id ${req.params.id}` });
        });
};

// Update a Question identified by the BrandId in the request
exports.updateQ = (req, res) => {

    console.log("Updating Question " + JSON.stringify(req.body));

    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Question body can not be empty" });
    }

    // Find Question and update it with the request body
    Question.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(Question => {
            if (!Question) {
                return res.status(404).send({ message: `Question not found with id ${req.params.id}` });
            }
            res.send(Question);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({ message: `Question not found with id ${req.params.id}` });
            }
            return res.status(500).send({ message: `Error updating Question with id ${req.params.id}` });
        });
};

// Delete a Question with the specified BrandId in the request
exports.deleteQ = (req, res) => {
    Question.findByIdAndRemove(req.params.id)
        .then(Question => {
            if (!Question) {
                return res.status(404).send({ message: `Question not found with id ${req.params.id}` });
            }
            res.send({ message: "Question deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({ message: `Question not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Could not delete Question with id ${req.params.id}`
            });
        });
};

exports.deleteAllQ = (req, res) => {

    Question.remove().then(result => {
        res.send({ message: "Deleted all questions" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all Questions. ${err.message}`
        });
    });
}

/**
 * Persists new Question Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persistQ(req, res) {

    console.log(`Attempting to persist an Question ` + JSON.stringify(req.body));

    const Question = buildQuestion(req);

    // Save Question in the database
    Question.save()
        .then(data => {
            console.log(`Persisted Question: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while creating the Question." });
        });
}

/**
 * Builds Question from incoming Request.
 
 * @returns Question Model
 * @param {Request} req 
 */
function buildQuestion(req) {
    return new Question(buildQuestionJson(req));
}

/**
 * Builds Question JSON incoming Request.
 * 
 * @returns {String} Question JSON
 * @param {Request} req 
 */
function buildQuestionJson(req) {
    var data = _.pick(req.body, 'question', 'product', 'userEmail', 'userName', 'date')
    if (!data.date) {
        data.date = new Date();
    }

    if (!data.userName) {
        data.userName = 'Anonymous';
    }

    return data;
}


// Create and Save a new Answer for a Question
exports.createA = (req, res) => {

    console.log("Creating new Answer " + JSON.stringify(req.body));

    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);

    if (!errors.isEmpty()) {
        var err = _.uniq(errors.array());
        console.log('Cannot create question: ' + err);
        return res.json({ errors: err });
    }
    Question.findById(req.body.question)
        .then(Question => {
            if (!Question) {
                console.error(`Cannot create a answer for question: ${req.body.question}. Question not found`);
                return res.status(404).send({ message: `Question not found ${req.body.question}` });
            }
            persistA(req, res);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                console.error(`Cannot create a answer for question: ${req.body.question}. Question not found, ${err}`);
                return res.status(404).send({ message: `Question not found ${req.body.question}` });
            }
            console.error(`Cannot create a answer for question: ${req.body.question}. Question not found, ${err}`);
            return res.status(500).send({ message: `Error while creating Answer` });
        });

};

/**
 * Persists new Answer Model 
 * 
 * @param {Request} req The HTTP Request 
 * @param {Response} res The HTTP Response
 */
function persistA(req, res) {

    console.log(`Attempting to persist an Answer ` + JSON.stringify(req.body));

    const answer = new Answer(buildAJson(req));

    // Save Answer in the database
    answer.save()
        .then(data => {
            console.log(`Persisted Answer: ${data._id}`);
            res.status(201).send(data);
        }).catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while creating the Answer." });
        });
}

/**
 * Builds Answer JSON incoming Request.
 * 
 * @returns {String} Answer JSON
 * @param {Request} req 
 */
function buildAJson(req) {
    var data = _.pick(req.body, 'question', 'answer', 'userEmail', 'userName', 'date')
    if (!data.date) {
        data.date = new Date();
    }

    if (!data.userName) {
        data.userName = 'Anonymous';
    }

    return data;
}

// Retrieve and return all Answers for a Question
exports.findAllA = (req, res, next) => {

    var query = Answer.find();

    if (req.query.question) {
        query.where("question").equals(req.query.question);
    }

    if (req.query.userEmail) {
        query.where("userEmail").equals(req.query.userEmail);
    }

    Answer.find(query).sort({ date: -1 }).then(result => {
        if (result) {
            console.log(`Returning ${result.length} answers.`);
            res.send(result);
        } else {
            console.log("Returning no Answer");
            res.send({});
        }
    }).catch(err => { res.status(500).send({ message: err.message }) });
};

// Find a single Question with a ID
exports.findOneA = (req, res) => {

    Answer.findById(req.params.id)
        .then(Answer => {
            if (!Answer) {
                console.log(`Cannot find answer with id ${req.params.id}`);
                return res.status(404).send({ message: `Answer not found with id ${req.params.id}` });
            }
            console.log(`Returning an answer for id ${req.params.id}`);
            res.send(Answer);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                console.log(`Cannot find answer with id ${req.params.id}`);
                return res.status(404).send({ message: `Answer not found with id ${req.params.id}` });
            }
            console.log(`Cannot find answer with id ${req.params.id}`);
            return res.status(500).send({ message: `Error while retrieving Answer with id ${req.params.id}` });
        });
};