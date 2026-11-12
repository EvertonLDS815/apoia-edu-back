const mongoose = require('mongoose');

const connectDB = async () => {
    console.log('Node:', process.version);
    console.log('Mongoose:', mongoose.version);

    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('🚀 MongoDB connected!!');

        mongoose.connection.on('error', (error) => {
            console.error('🔴 Error in MongoDB connection:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🟡 MongoDB disconnected!');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🟢 MongoDB reconnected!');
        });

    } catch (err) {
        console.error('🔴 Error connecting to MongoDB:', err);
        throw err;
    }
};

module.exports = connectDB;