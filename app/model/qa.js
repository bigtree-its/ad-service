const { Query } = require("mongoose")

const A = {
    id: "",
    answer: "",
    date: "",
    userEmail: "",
    userName: "",
}

const Q = {
    id: "",
    question: "",
    answers: [A],
    date: "",
    userEmail: "",
    userName: "",
}

var QA = {entity:"", questions:[Q]};

module.exports = { QA, Q, A }