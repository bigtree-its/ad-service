const fs = require("fs");
const { parse } = require("csv-parse");
const PostcodeDistrict = require('../../model/common/postcodedistrict');

exports.loadCsv = (req, res) => {
    console.log("Reading csv file");
    fs.createReadStream(req.query.fileLocation)
        // .pipe(parse({ delimiter: ",", from_line: 1, to_line: 5 }))
        .pipe(parse({ delimiter: ",", from_line: 2, }))
        .on("data", function(row) {
            // console.log(row);
            var council = "";
            var coverage = "";
            var prefix = row[0];
            var cell = row[1];
            if (cell.includes("(")) {
                var start = cell.indexOf("(");
                var end = cell.indexOf(")");
                council = cell.substring(0, start).trim();
                coverage = cell.substring(start + 1, end);
            } else {
                coverage = cell;
            }
            req.body.area = req.query.area;
            req.body.prefix = prefix;
            req.body.coverage = coverage;
            req.body.council = council;
            req.body.postTown = req.query.postTown;
            persistPostcodeDistrict(req);
        })
        .on("end", function() {
            console.log("finished");
            res.status(200);
            res.send('Success')
        })
        .on("error", function(error) {
            console.log(error.message);
            res.status(500);
            res.send('Error when reading csv file ' + error)
        });
};

/**
 * Builds PostcodeDistrict object from Request
 * 
 * @param {Request} req 
 */
function buildPostcodeDistrictObject(req) {
    return new PostcodeDistrict(buildPostcodeDistrictJson(req));
}

function persistPostcodeDistrict(req) {
    const PostcodeDistrict = buildPostcodeDistrictObject(req);
    // Save PostcodeDistrict in the database
    PostcodeDistrict.save()
        .then((data) => {})
        .catch((err) => {
            console.log('Error when persisting postcode district');
        });
}

/**
 * Builds PostcodeDistrict Json from Request
 * 
 * @param {Request} req 
 */
function buildPostcodeDistrictJson(req) {
    return {
        active: true,
        prefix: req.body.prefix,
        area: req.body.area,
        coverage: req.body.coverage,
        council: req.body.council,
        postTown: req.body.postTown,
        slug: req.body.slug || getSlug(req.body.prefix, req.body.area)
    };
}

/**
 * Returns the slug from the given prefix
 * e.g if prefix = M & S PostcodeDistricts then Slug = m-s-PostcodeDistricts
 * Replaces special characters and replace space with -
 * 
 * @param {String} prefix 
 */
function getSlug(prefix, area) {
    return prefix.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + area.trim().replace(/[\W_]+/g, "_").toLowerCase()
}