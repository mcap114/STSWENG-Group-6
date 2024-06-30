const express = require("express");
const asyncHandler = require("express-async-handler");
const Benefactor = require("../models/benefactor");

const router = express.Router();    

//GET request for creating benefactor.
router.get('/create', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor create GET");
}));

//POST request for creating benefactor.
router.post('/create', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor create POST");
}));

//GET request for editing benefactor.
router.get('/:id/edit', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor edit GET");
}));

//POST request for editing benefactor.
router.post('/:id/edit', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor edit POST");
}));

//GET request for deleting benefactor. 
router.get('/:id/delete', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor delete GET");
}));

//POST request for deleting benefactor. 
router.post('/:id/delete', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor delete POST");
}));

//GET request to list all benefactors.
router.get('/', asyncHandler(async (req, res, next) => {
    const benefactors = await Benefactor.find()
                                           .sort({ first_name: 1, last_name: 1})
                                           .exec();

    console.log(benefactors);
    res.render("benefactor-list", { benefactors: benefactors });
}));

//GET request for one benefactor.
router.get('/:id', asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Benefactor detail");
}));

module.exports = router;