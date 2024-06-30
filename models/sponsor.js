const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BenefactorSchema = new Schema({
    name: { type: String, required: true, },
    type: {
        type: String,
        required: true,
        enum: ["", "", "", "",],
    },
});

module.exports = mongoose.model("Sponsor", BenefactorSchema, "sponsors");