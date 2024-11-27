const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Benefactor = require("../models/benefactor");
const Benefit = require("../models/benefit");

// Session Authenticator
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

// GET request to list all benefactors with sorting and filtering
router.get('/', asyncHandler(async(req, res) => {
    const { nameSort, typeFilter, page = 1, limit = 20 } = req.query;

    let sortOptions = {};
    let filterOptions = {};

    if (nameSort) {
        sortOptions['name'] = nameSort === 'az' ? 1 : -1;
    }

    if (typeFilter) {
        filterOptions.type = { $in: typeFilter.split(',') };
    }

    // Logging for debugging
    console.log('Filter Options:', filterOptions);
    console.log('Sort Options:', sortOptions);

    const totalBenefactors = await Benefactor.countDocuments(filterOptions);
    const benefactors = await Benefactor.find(filterOptions)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .exec();

    console.log('Filtered Benefactors:', benefactors);

    res.render("benefactor-list", {
        benefactors,
        currentPage: page,
        totalPages: Math.ceil(totalBenefactors / limit),
        totalBenefactors
    });
}));

// POST request for creating benefactor
router.post('/create', asyncHandler(async(req, res) => {
    const { benefactorName, benefactorType } = req.body;

    const newBenefactor = new Benefactor({
        name: benefactorName,
        type: benefactorType,
    });

    console.log(newBenefactor);

    await newBenefactor.save();

    console.log("New benefactor instance saved.");
    res.sendStatus(201); // HTTP 201: Created
}));

// POST request for editing benefactor
router.post('/edit', asyncHandler(async(req, res) => {
    const { benefactor_id, benefactor_name, benefactor_type } = req.body;

    console.log("Received data:", req.body);

    if (!benefactor_id || !benefactor_name || !benefactor_type) {
        console.log("Missing fields:", req.body);
        return res.status(400).json({ message: "All fields are required" });
    }

    const updateData = {
        name: benefactor_name,
        type: benefactor_type
    };

    try {
        const result = await Benefactor.updateOne({ _id: benefactor_id }, updateData);

        if (result.nModified === 0) {
            console.log("No changes made or benefactor not found:", benefactor_id);
            return res.status(404).json({ message: "Benefactor not found or no changes made" });
        }

        console.log("Benefactor updated successfully:", benefactor_id);
        res.sendStatus(200); // HTTP 200: OK
    } catch (error) {
        console.error("Error updating benefactor:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

// POST request for deleting benefactor
router.post('/delete', asyncHandler(async(req, res) => {
    const benefits = await Benefit.find({ benefactor: req.body.benefactor_id }).exec();

    console.log(`Benefits: ${benefits}`);

    if (benefits.length > 0) {
        console.log(`Benefactor ID ${req.body.benefactor_id} cannot be deleted.`);
        res.sendStatus(409)
    } else {
        await Benefactor.deleteOne({ _id: req.body.benefactor_id });
        console.log(`Benefactor ID ${req.body.benefactor_id} has been deleted.`);
        res.sendStatus(200); // HTTP 200: OK
    }
}));

// POST request for deleting MULTIPLE benefactors
router.post('/delete-multiple', (req, res) => {
    const { ids } = req.body;

    if (!ids || !ids.length) {
        return res.status(400).json({ message: 'No IDs provided.' });
    }

    Benefactor.deleteMany({ _id: { $in: ids } })
        .then(() => res.status(200).json({ message: 'Benefactors deleted successfully.' }))
        .catch(error => {
            console.error('Error deleting items:', error);
            res.status(500).json({ message: 'Server error.' });
        });
});

router.post('/import', asyncHandler(async (req, res) => {
    const { benefactor } = req.body;
    console.log('Received data:', req.body); // For debugging received data

    if (!benefactor || !Array.isArray(benefactor) || benefactor.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid CSV data.' });
    }

    try {
        const operations = benefactor.map(b => ({
            updateOne: {
                filter: { name: b.name }, // Match only by name
                update: {
                    $set: {
                        type: b.type // Update type
                    }
                },
                upsert: true // Insert new document if no match is found
            }
        }));

        await Benefactor.bulkWrite(operations); // Perform bulk upsert
        console.log('Imported/Updated benefactor data successfully.');
        res.json({ success: true });
    } catch (error) {
        console.error('Error importing/updating benefactor data:', error);
        res.status(500).json({ success: false, message: 'Failed to import/update benefactor data.' });
    }
}));



module.exports = router;