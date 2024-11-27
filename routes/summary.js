const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const json = require("json");

const Program = require("../models/program");
const Person = require("../models/person");
const Beneficiary = require("../models/beneficiary");
const Benefactor = require("../models/benefactor");
const Benefit = require("../models/benefit");
const Documentation = require("../models/documentation");

function requireAuth(req, res, next) {
    console.log("Checking authentication...");
    if (req.session.user && req.session.user.authenticated) {
        console.log("User is authenticated. Proceeding to benefactors page...");
        next();
    } else {
        console.log("User is not authenticated. Redirecting to login page...");
        res.redirect('/login');
    }
}

router.use(requireAuth);

// Get request for summary.
router.get('/', asyncHandler(async (req, res) => {
    const totalCounts = {
        programs: await Program.countDocuments(),
        benefits: await Benefit.countDocuments(),
        people: await Person.countDocuments(),
        benefactors: await Benefactor.countDocuments()
    };

    // Program count by program type
    const programCountsByType = {
        assistance: await Program.countDocuments({ program_type: "Assistance" }),
        initiative: await Program.countDocuments({ program_type: "Initiative" }),
        service: await Program.countDocuments({ program_type: "Service" }),
        program: await Program.countDocuments({ program_type: "Program" })
    };

    // Program count by program frequency
    const programCountByFrequency = {
        monthly: await Program.countDocuments({ frequency: "Monthly" }),
        quarterly: await Program.countDocuments({ frequency: "Quarterly" }),
        semi_annual: await Program.countDocuments({ frequency: "Semi-Annual" }),
        yearly: await Program.countDocuments({ frequency: "Yearly" })
    };

    // Program count by program assistance type
    const programCountByAssistance = {
        educational: await Program.countDocuments({ assistance_type: "Educational" }),
        financial: await Program.countDocuments({ assistance_type: "Financial" }),
        medical: await Program.countDocuments({ assistance_type: "Medical" })
    };

    const programs = await Program.find().sort({ name: 1 }).lean().exec();

    // People count by gender
    const peopleCountByGender = {
        male: await Person.countDocuments({ gender: "Male" }),
        female: await Person.countDocuments({ gender: "Female" }),
        other: await Person.countDocuments({ gender: "Other" })
    };

    // People count by disability type
    const peopleCountByDisabilityType = {
        physical: await Person.countDocuments({ disability_type: "Physical" }),
        sensory: await Person.countDocuments({ disability_type: "Sensory" }),
        intellectual: await Person.countDocuments({ disability_type: "Intellectual" }),
        mental: await Person.countDocuments({ disability_type: "Mental" })
    };

    const people = await Person.find().sort({ last_name: 1, first_name: 1 }).lean().exec();

    // Benefactors count by type
    const benefactorCountByType = {
        individual: await Benefactor.countDocuments({ type: "Individual" }),
        government: await Benefactor.countDocuments({ type: "Government" }),
        organization: await Benefactor.countDocuments({ type: "Organization" })
    };

    const benefactors = await Benefactor.find().sort({ name: 1 }).lean().exec();

    
    res.render("summary", {
        totalCounts,
        programCountsByType,
        programCountByFrequency,
        programCountByAssistance,
        programs,
        peopleCountByGender,
        peopleCountByDisabilityType,
        benefactorCountByType,
        people,
        benefactors
    });

}));


module.exports = router;