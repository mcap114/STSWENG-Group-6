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
router.get('/', asyncHandler(async(req, res) => {
    const totalProgramCount = await Program.find().count();
    const totalBenefitCount = await Benefit.find().count();
    const totalBenefactorCount = await Benefactor.find().count();

    const totalCounts = {
        programs: await Program.find().count(),
        benefits: await Benefit.find().count(),
        people: await Person.find().count(),
        benefactors: await Benefactor.find().count()
    }

    //Program count by program type.
    const programCountsByType = {
        assistance: await Program.find({ program_type: "Assistance" }).count(),
        initiative: await Program.find({ program_type: "Initiative" }).count(),
        service: await Program.find({ program_type: "Service" }).count(),
        program: await Program.find({ program_type: "Program" }).count()
    };

    //Program count by program frequency.
    const programCountByFrequency = {
        monthly: await Program.find({ frequency: "Monthly" }).count(),
        quarterly: await Program.find({ frequency: "Quarterly" }).count(),
        semi_annual: await Program.find({ frequency: "Semi-Annual" }).count(),
        yearly: await Program.find({ frequency: "Yearly" }).count()
    };

    //Program count by program assistance type.
    const programCountByAssistance = {
        educational: await Program.find({ assistance_type: "Educational" }).count(),
        financial: await Program.find({ assistance_type: "Financial" }).count(),
        medical: await Program.find({ assistance_type: "Medical" }).count()
    };

    const programs = await Program.find().sort({ name: 1 }).lean().exec();

    // People count by gender
    const peopleCountByGender = {
        male: await Person.find({ gender: "Male" }).count(),
        female: await Person.find({ gender: "Female" }).count(),
        other: await Person.find({ gender: "Other" }).count(),
    };

    // People countby disability type
    const peopleCountByDisabilityType = {
        physical: await Person.find({ disability_type: "Physical" }).count(),
        sensory: await Person.find({ disability_type: "Sensory" }).count(),
        intellectual: await Person.find({ disability_type: "Intellectual" }).count(),
        mental: await Person.find({ disability_type: "Mental" }).count(),
    };

    const people = await Person.find().sort({ last_name: 1, first_name: 1 }).lean().exec();

    // Benefactors count by type
    const benefactorCountByType = {
        individual: await Benefactor.find({ type: "Individual" }).count(),
        government: await Benefactor.find({ type: "Government" }).count(),
        organization: await Benefactor.find({ type: "Organization" }).count(),
    };

    const benefactors = await Benefactor.find().sort({ name: 1 }).lean().exec();

        for (const program of programs) {
            const beneficiary_counts = await Beneficiary.aggregate([
                { $match: { program_enrolled: program._id } },
                { $count: "beneficiary_count" }
            ]);
        
            const benefit_counts = await Beneficiary.aggregate([
                { $match: { program_enrolled: program._id } },
                { $group: { _id: "$benefit_delivered" } },
                { $count: "benefit_count" }
            ]);
        
            const people_counts = await Beneficiary.aggregate([
                { $match: { program_enrolled: program._id } },
                { $group: { _id: "$person_registered" } },
                { $count: "people_count" }
            ]);
        
            const benefactor_counts = await Beneficiary.aggregate([
                { $match: { program_enrolled: program._id } },
                {
                    $lookup: {
                        from: "benefits",
                        localField: "benefit_delivered",
                        foreignField: "_id",
                        as: "benefit",
                    },
                },
                { $unwind: "$benefit" },
                { $group: { _id: "$benefit.benefactor" } },
                { $count: "benefactor_count" }
            ]);
        
            program.beneficiary_count = beneficiary_counts.length > 0 ? beneficiary_counts[0].beneficiary_count : 0;
            program.benefit_count = benefit_counts.length > 0 ? benefit_counts[0].benefit_count : 0;
            program.people_count = people_counts.length > 0 ? people_counts[0].people_count : 0;
            program.benefactor_count = benefactor_counts.length > 0 ? benefactor_counts[0].benefactor_count : 0;
        }
        
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