const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const json = require("json");
const Benefit = require("../models/benefit");
const Benefactor = require("../models/benefactor");
const Beneficiary = require("../models/beneficiary");

// Session Authenticator
function requireAuth(req, res, next) {
    console.log("Checking authentication...");
    if (req.session.user && req.session.user.authenticated) {
        console.log("User is authenticated. Proceeding to benefits page...");
        next();
    } else {
        console.log("User is not authenticated. Redirecting to login page...");
        res.redirect('/login');
    }
}

router.use(requireAuth);

// GET request to list all benefits with sorting and filtering
router.get('/', asyncHandler(async(req, res) => {
    const { nameSort, quantitySort, dateSort, benefactorFilter, page = 1, limit = 20 } = req.query;

    let sortOptions = {};
    let filterOptions = {};

    if (nameSort) {
        sortOptions['name'] = nameSort === 'az' ? 1 : -1;
    }

    if (quantitySort) {
        sortOptions['quantity'] = quantitySort === 'asc' ? 1 : -1;
    }

    if (dateSort) {
        sortOptions['date_received'] = dateSort === 'newest' ? -1 : 1;
    }

    if (benefactorFilter) {
        filterOptions['benefactor.name'] = { $in: benefactorFilter.split(',') };
    }

    // Logging for debugging
    console.log('Filter Options:', filterOptions);
    console.log('Sort Options:', sortOptions);

    const totalBenefits = await Benefit.countDocuments(filterOptions);
    const benefits = await Benefit.find(filterOptions).populate("benefactor")
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .exec();

    const benefactors = await Benefactor.find().exec();

    console.log('Filtered Benefits:', benefits);

    res.render("benefit-list", {
        benefactors,
        benefits,
        currentPage: page,
        totalPages: Math.ceil(totalBenefits / limit),
        totalBenefits
    });
}));

router.post('/create', asyncHandler(async(req, res, next) => {
    const { benefitName, benefitDesc, quantity, dateReceived, benefactor } = req.body;

    const newBenefit = new Benefit({
        name: benefitName,
        description: benefitDesc,
        quantity: quantity,
        date_received: dateReceived,
        benefactor: benefactor
    });

    await newBenefit.save();

    console.log("New benefit instance saved.");
    res.redirect('/benefits');
    res.sendStatus(201);
}));


// POST request for editing item
// router.post('/edit', asyncHandler(async (req, res, next) => { //Change to post. POST will be used.
//     const {benefit_id, name, description,
//            quantity, date_received,
//            benefactor } = req.body;
//
//     if  (name === "") {
//         res.sendStatus(400); // HTTP 400: Bad Request
//     }
//
//     const benefit = {
//         name: name,
//         description: description,
//         quantity: quantity,
//         date_received: date_received,
//         benefactor: benefactor
//     };
//
//     await Program.updateOne({_id: benefit_id}, benefit);
//     console.log(benefit);
//     res.sendStatus(200);
// }));

// POST request for editing a benefit
router.post('/edit', asyncHandler(async(req, res) => {
    const { id, name, description, quantity, date_received, benefactor } = req.body;

    console.log("Received data:", req.body);

    if (!id || !name || !description || !quantity || !date_received || !benefactor) {
        console.log("Missing fields:", req.body);
        return res.status(400).json({ message: "All fields are required" });
    }

    const updateData = {
        name: name,
        description: description,
        quantity: quantity,
        date_received: new Date(date_received), 
        benefactor: benefactor
    };

    try {
        const result = await Benefit.updateOne({ _id: id }, updateData);

        if (result.nModified === 0) {
            console.log("No changes made or benefit not found:", id);
            return res.status(404).json({ message: "Benefit not found or no changes made" });
        }

        console.log("Benefit updated successfully:", id);
        res.sendStatus(200);
    } catch (error) {
        console.error("Error updating benefit: haha", error);
        res.status(500).json({ message: "Internal server error" });

    }
}));



// POST request for deleting item
router.post('/delete', asyncHandler(async(req, res, next) => {
    const beneficiaries = await Beneficiary.find({ benefit_delivered: req.body.benefit_id  }).exec();

    console.log(`Beneficiaries: ${beneficiaries}`);

    if (beneficiaries.length > 0) {
        console.log("Benefit ID " + req.body.benefit_id + " cannot be deleted.");
        res.sendStatus(409)
    } else {
        await Benefit.deleteOne({ _id: req.body.benefit_id });
        console.log("Benefit ID " + req.body.benefit_id + " has been deleted.");
        res.sendStatus(200);
    }
}));

// POST request for deleting MULTIPLE benefits
router.post('/delete-multiple', (req, res) => {
    const { ids } = req.body;

    if (!ids || !ids.length) {
        return res.status(400).json({ message: 'No IDs provided.' });
    }

    Benefit.deleteMany({ _id: { $in: ids } })
        .then(() => res.status(200).json({ message: 'Benefits deleted successfully.' }))
        .catch(error => {
            console.error('Error deleting items:', error);
            res.status(500).json({ message: 'Server error.' });
        });
});

//POST for importing a csv file
router.post('/import', asyncHandler(async (req, res) => {
    const { benefit } = req.body;
    console.log('Received data:', req.body); // For debugging received data

    if (!benefit || !Array.isArray(benefit) || benefit.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid data.' });
    }

    try {
        const operations = await Promise.all(benefit.map(async (benefit) => {
            const benefactorDoc = await Benefactor.findOne({ name: benefit.benefactor }); // Look up the benefactor
            if (!benefactorDoc) {
                throw new Error(`Benefactor not found for name: ${benefit.benefactor}`);
            }

            return {
                updateOne: {
                    filter: { name: benefit.name }, // Match only by benefit name
                    update: {
                        $set: {
                            description: benefit.description,
                            quantity: Number(benefit.quantity), // Ensure this is a number
                            date_received: new Date(benefit.date_received), // Ensure this is a date
                            benefactor: benefactorDoc._id, // Use the ObjectId from the benefactor document
                        },
                    },
                    upsert: true // Insert new document if no match is found
                }
            };
        }));

        // Perform bulk write operation
        await Benefit.bulkWrite(operations);
        console.log('Imported/Updated benefit data successfully.');
        res.json({ success: true });
    } catch (error) {
        console.error('Error importing/updating benefit data:', error);
        res.status(500).json({ success: false, message: 'Failed to import/update benefit data: ' + error.message });
    }
}));



module.exports = router;