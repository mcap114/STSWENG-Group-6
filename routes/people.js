const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const json = require("json");
const Person = require("../models/person");
const Program = require("../models/program");
const Beneficiary = require("../models/beneficiary");
const fileUpload = require("express-fileupload");
const csv = require("csv-parser");



// Session Authenticator
function requireAuth(req, res, next) {
    console.log("Checking authentication...");
    if (req.session.user && req.session.user.authenticated) {
        console.log("User is authenticated. Proceeding to people page...");
        next();
    } else {
        console.log("User is not authenticated. Redirecting to login page...");
        res.redirect('/login');
    }
}

router.use(requireAuth);

// GET request to list all people with sorting and filtering
router.get('/', asyncHandler(async(req, res) => {
    const { firstNameSort, lastNameSort, genderFilter, birthdateSort, barangayFilter, disabilityTypeFilter, page = 1, limit = 20 } = req.query;

    let sortOptions = {};
    let filterOptions = {};

    if (firstNameSort) {
        sortOptions['first_name'] = firstNameSort === 'az' ? 1 : -1;
    }

    if (lastNameSort) {
        sortOptions['last_name'] = lastNameSort === 'az' ? 1 : -1;
    }

    if (genderFilter) {
        filterOptions.gender = genderFilter;
    }

    if (birthdateSort) {
        sortOptions['birthdate'] = birthdateSort === 'newest' ? -1 : 1;
    }

    if (barangayFilter) {
        filterOptions.barangay = { $in: barangayFilter.split(',') };
    }

    if (disabilityTypeFilter) {
        filterOptions.disability_type = { $in: disabilityTypeFilter.split(',') };
    }

    // Logging for debugging
    console.log('Filter Options:', filterOptions);
    console.log('Sort Options:', sortOptions);

    const totalPeople = await Person.countDocuments(filterOptions);
    const people = await Person.find(filterOptions).sort(sortOptions)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .exec();

    // Fetch unique barangay codes
    const barangayCodes = await Person.distinct("barangay").exec();

    console.log('Filtered People:', people);
    console.log('Barangay Codes:', barangayCodes);

    res.render("people-list", {
        people,
        barangayCodes,
        currentPage: page,
        totalPages: Math.ceil(totalPeople / limit),
        totalPeople
    });
}));

// POST request for creating people.
router.post('/create', asyncHandler(async(req, res) => {
    const {
        firstName,
        lastName,
        gender,
        birthdate,
        address,
        barangay,
        contactNumber,
        disability,
        disabilityType,
        pwd_card_id_no,
        recent_pwd_id_update_date
    } = req.body;

    const newPerson = new Person({
        first_name: firstName,
        last_name: lastName,
        gender,
        birthdate,
        address,
        barangay,
        contact_number: contactNumber,
        disability_type: disabilityType,
        disability,
        pwd_card_id_no,
        recent_pwd_id_update_date,
    });

    await newPerson.save();

    await Person.create(newPerson);
    console.log("New person instance saved.");
    res.sendStatus(201);
}));


// POST request for updating person
router.post('/edit', asyncHandler(async(req, res, next) => {
    const {
        id,
        first_name,
        last_name,
        gender,
        birthdate,
        address,
        barangay,
        contact_number,
        disability_type,
        disability,
        pwd_card_id_no,
        recent_pwd_id_update_date
    } = req.body;




    // Convert birthdate and recent_pwd_id_update_date to Date objects
    let birthdateDate, recentPwdUpdateDate;
    try {
        birthdateDate = new Date(birthdate);
        recentPwdUpdateDate = new Date(recent_pwd_id_update_date);
    } catch (error) {
        return res.status(400).send('Invalid date format'); // HTTP 400: Bad Request
    }

    // Prepare the person object for update
    const person = {
        first_name,
        last_name,
        gender,
        birthdate,
        address,
        barangay,
        contact_number,
        disability_type,
        disability,
        pwd_card_id_no,
        recent_pwd_id_update_date,
    };

    try {
        const result = await Person.updateOne({ _id: id }, person);

        if (result.nModified === 0) {
            return res.status(404).send('Person not found'); // HTTP 404: Not Found
        }
        console.log("People updated successfully:", id);
        res.sendStatus(200); // HTTP 200: OK
    } catch (error) {
        next(error);
    }
}));

// GET request for fetching people list under a specific program
router.get('/:id', asyncHandler(async(req, res, next) => {
    try {
        // Fetch the program details by ID
        const program = await Program.findById(req.params.id);

        // Check if the program exists
        if (!program) {
            console.log('Program not found with ID:', req.params.id);
            return res.status(404).send('Program not found');
        }

        // Log the program details
        console.log('Program details:', program);

        // Render the people list template with the fetched data
        res.render('people-list', { title: 'People List', program, barangayCodes });
    } catch (err) {
        // Handle any errors that occur during fetching
        console.error('Error fetching program details:', err);
        res.status(500).send(err.message);
    }
}));


//POST request for deleting person
router.post('/delete', asyncHandler(async(req, res) => {
    const beneficiaries = await Beneficiary.find({ person_registered: req.body.person_id  }).exec();

    console.log(`Beneficiaries: ${beneficiaries}`)
    if (beneficiaries.length > 0) {
        console.log(`Person ID ${req.body.person_id} cannot be deleted.`);
        res.sendStatus(409);
    } else {
        await Person.deleteOne({ _id: req.body.person_id });
        console.log(`Person ID ${req.body.person_id} has been deleted.`);
        res.sendStatus(200);
    }
}));

// POST request for deleting MULTIPLE people
router.post('/delete-multiple', (req, res) => {
    const { ids } = req.body;

    if (!ids || !ids.length) {
        return res.status(400).json({ message: 'No IDs provided.' });
    }
    
    Person.deleteMany({ _id: { $in: ids } })
        .then(() => res.status(200).json({ message: 'People deleted successfully.' }))
        .catch(error => {
            console.error('Error deleting items:', error);
            res.status(500).json({ message: 'Server error.' });
        });
});


// Enable file upload
router.use(fileUpload());

router.post('/import', asyncHandler(async (req, res) => {
    const { people } = req.body;
    console.log('Received data:', req.body); // For debugging received data

    if (!people || !Array.isArray(people) || people.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid CSV data.' });
    }

    try {
        const operations = people.map(person => ({
            updateOne: {
                filter: { first_name: person.first_name, last_name: person.last_name },  // Matching criteria (first and last name)
                update: {
                    $set: {
                        gender: person.gender,
                        birthdate: new Date(person.birthdate),
                        address: person.address,
                        barangay: person.barangay,
                        contact_number: person.contact_number,
                        disability_type: person.disability_type,
                        disability: person.disability,
                        pwd_card_id_no: person.pwd_card_id_no,
                        recent_pwd_id_update_date: new Date(person.recent_pwd_id_update_date)
                    }
                },
                upsert: true // Insert new document if no match is found
            }
        }));

        await Person.bulkWrite(operations); // Perform bulk upsert
        console.log('Imported/Updated people data successfully.');
        res.json({ success: true });
    } catch (error) {
        console.error('Error importing/updating people data:', error);
        res.status(500).json({ success: false, message: 'Failed to import/update people data.' });
    }
}));




module.exports = router;