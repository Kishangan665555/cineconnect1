const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/cineconnect').then(async () => {
    const Booking = require('./models/Booking.model');
    const bookings = await Booking.find().lean();
    let corruptedIds = [];
    
    for (let b of bookings) {
        let isCorrupted = false;

        // Check if movieId is a string and NOT a valid ObjectId
        if (b.movieId && typeof b.movieId === 'string' && !mongoose.Types.ObjectId.isValid(b.movieId)) {
            isCorrupted = true;
        }
        
        // Check if theatreId is a string and NOT a valid ObjectId
        if (b.theatreId && typeof b.theatreId === 'string' && !mongoose.Types.ObjectId.isValid(b.theatreId)) {
            isCorrupted = true;
        }

        if (isCorrupted) {
            corruptedIds.push(b._id);
        }
    }
    
    console.log('Corrupted Bookings Count:', corruptedIds.length);
    
    if (corruptedIds.length > 0) {
        await Booking.deleteMany({ _id: { $in: corruptedIds } });
        console.log('Deleted corrupted bookings successfully.');
    }
    
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
