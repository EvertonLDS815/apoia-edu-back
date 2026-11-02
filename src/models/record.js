const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true
        },
        behavior: {
            set: {
                    type: [String],
                    enum: ['Ansioso(a)', 'Calmo(a)', 'Cooperativo(a)', 'Feliz', 'Inquieto(a)', 'Introvertido(a)', 'Nervoso(a)', 'Sociável', 'Sonolento(a)'],
                    default: [],
                    required: true
                },
        },
        participation: {
            set: {
                type: [String],
                enum: ['Participou sem apoio', 'Participou com apoio', 'Não participou'],
                default: [],
                required: true
            },
        },
        description: {
            type: String,
            default: ""
        },
        childId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Child',
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;