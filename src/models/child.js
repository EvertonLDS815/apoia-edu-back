const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        grade: {
            type: String
        },
        description: {
            type: String,
            default: ""
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);


childSchema.index({ name: 1 }, { unique: true });

const Child = mongoose.model('Child', childSchema);

module.exports = Child;