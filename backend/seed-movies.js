/**
 * seed-movies.js
 * Run with: node seed-movies.js
 *
 * Seeds 12 realistic movies into MongoDB.
 * Safe to re-run – upserts by title so no duplicates.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cineconnect';

// ── Quick inline schema (avoids model conflicts with running server) ────────────
const movieSchema = new mongoose.Schema({}, { strict: false });
const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

const TODAY = new Date();
const daysAgo  = (n) => new Date(TODAY - n * 86400000).toISOString().split('T')[0];
const daysAhead = (n) => new Date(+TODAY + n * 86400000).toISOString().split('T')[0];

const MOVIES = [
  {
    title: 'Kalki 2898 AD',
    genre: ['Action', 'Sci-Fi', 'Drama'],
    language: ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada'],
    duration: 181,
    rating: 8.2,
    aiRating: 8.4,
    votes: 124500,
    releaseDate: daysAgo(30),
    certificate: 'UA',
    director: 'Nag Ashwin',
    description: 'A mythological sci-fi epic set in a dystopian future where the world awaits the 10th avatar of Vishnu.',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzYzZjZiZjQtMWJiOS00ZDczLTkzNDktNTQwYmIwNDJiNjZkXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BNzYzZjZiZjQtMWJiOS00ZDczLTkzNDktNTQwYmIwNDJiNjZkXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: true,
    cast: ['Prabhas', 'Deepika Padukone', 'Amitabh Bachchan', 'Kamal Haasan'],
  },
  {
    title: 'Stree 2',
    genre: ['Horror', 'Comedy'],
    language: ['Hindi'],
    duration: 142,
    rating: 8.5,
    aiRating: 8.3,
    votes: 210000,
    releaseDate: daysAgo(60),
    certificate: 'UA',
    director: 'Amar Kaushik',
    description: 'The ghost of Stree returns — but this time something far more dangerous has arrived in Chanderi.',
    poster: 'https://m.media-amazon.com/images/M/MV5BZGViMjI0ZmMtYTQ3NS00ZTgwLTg3ZGItMDIzZjA0YTk2YjVhXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BZGViMjI0ZmMtYTQ3NS00ZTgwLTg3ZGItMDIzZjA0YTk2YjVhXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    isNowShowing: false,
    isComingSoon: false,
    isTrending: true,
    cast: ['Shraddha Kapoor', 'Rajkummar Rao', 'Aparshakti Khurana', 'Pankaj Tripathi'],
  },
  {
    title: 'Pushpa 2: The Rule',
    genre: ['Action', 'Thriller', 'Drama'],
    language: ['Telugu', 'Hindi', 'Tamil'],
    duration: 190,
    rating: 8.0,
    aiRating: 8.1,
    votes: 180000,
    releaseDate: daysAgo(15),
    certificate: 'A',
    director: 'Sukumar',
    description: 'Pushpa Raj battles the system and his rivals to establish his rule over the red sandalwood trade.',
    poster: 'https://m.media-amazon.com/images/M/MV5BZjJlYzQ3MWUtMzI2Ni00Y2Q2LTlmMzItMzBiYzhlMTA1YmVhXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: true,
    cast: ['Allu Arjun', 'Fahadh Faasil', 'Rashmika Mandanna'],
  },
  {
    title: 'Singham Again',
    genre: ['Action', 'Drama'],
    language: ['Hindi', 'Telugu', 'Tamil'],
    duration: 155,
    rating: 7.4,
    aiRating: 7.2,
    votes: 95000,
    releaseDate: daysAgo(45),
    certificate: 'UA',
    director: 'Rohit Shetty',
    description: 'ACP Bajirao Singham returns to battle corrupt forces that threaten the nation.',
    poster: 'https://m.media-amazon.com/images/M/MV5BOWZjMGM2MWYtOTBmNi00NWE5LTk2MDktMzk5MGNhZGMzMTJmXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: false,
    cast: ['Ajay Devgn', 'Kareena Kapoor', 'Ranveer Singh', 'Deepika Padukone'],
  },
  {
    title: 'Devara Part 1',
    genre: ['Action', 'Thriller'],
    language: ['Telugu', 'Hindi', 'Tamil'],
    duration: 166,
    rating: 7.1,
    aiRating: 7.3,
    votes: 87000,
    releaseDate: daysAgo(25),
    certificate: 'UA',
    director: 'Koratala Siva',
    description: 'A fearless man builds an empire of fear along the coast; decades later his son must reclaim the legacy.',
    poster: 'https://m.media-amazon.com/images/M/MV5BYWFjNjY5YTYtYzk5My00ZjE0LTk3OWItNGIwZGZkMTkwOGJiXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    banner: '',
    isNowShowing: false,
    isComingSoon: false,
    isTrending: false,
    cast: ['Jr NTR', 'Janhvi Kapoor', 'Saif Ali Khan'],
  },
  {
    title: 'Lucky Baskhar',
    genre: ['Crime', 'Drama', 'Thriller'],
    language: ['Telugu', 'Hindi', 'Tamil'],
    duration: 147,
    rating: 8.1,
    aiRating: 8.0,
    votes: 112000,
    releaseDate: daysAgo(20),
    certificate: 'UA',
    director: 'Venky Atluri',
    description: 'A mild-mannered bank employee gets accidentally caught up in a massive money laundering scheme.',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzU3MzIzMGMtOGVmNy00ZmQzLTlhMjctNWVjMzk2ZGVhOGVmXkEyXkFqcGdeQXVyMTUzNTgzNzM0._V1_.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: false,
    cast: ['Dulquer Salmaan', 'Meenakshi Chaudhary'],
  },
  {
    title: 'The Sabarmati Report',
    genre: ['Drama', 'Thriller'],
    language: ['Hindi'],
    duration: 135,
    rating: 7.6,
    aiRating: 7.5,
    votes: 54000,
    releaseDate: daysAgo(10),
    certificate: 'UA',
    director: 'Dheeraj Sarna',
    description: 'An investigative journalist uncovers the truth behind the Godhra train burning incident.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMjMwNjMxMzg5MF5BMl5BanBnXkFtZTgwNzU2NTE3NDE@._V1_.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: false,
    cast: ['Vikrant Massey', 'Raashii Khanna', 'Ridhi Dogra'],
  },
  {
    title: 'Mufasa: The Lion King',
    genre: ['Animation', 'Adventure', 'Drama'],
    language: ['English', 'Hindi'],
    duration: 118,
    rating: 7.8,
    aiRating: 7.9,
    votes: 76000,
    releaseDate: daysAgo(5),
    certificate: 'U',
    director: 'Barry Jenkins',
    description: 'The origin story of Mufasa, the legendary king of the Pride Lands, before Simba.',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzE1OTEwNzMyMl5BMl5BanBnXkFtZTgwMDQ3NzU3NjM@._V1_.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: true,
    cast: ['Aaron Pierre', 'Kelvin Harrison Jr.', 'Seth Rogen', 'Billy Eichner'],
  },
  {
    title: 'Sky Force',
    genre: ['Action', 'War', 'Drama'],
    language: ['Hindi'],
    duration: 145,
    rating: 7.9,
    aiRating: 7.8,
    votes: 61000,
    releaseDate: daysAgo(7),
    certificate: 'UA',
    director: 'Sandeep Kewlani, Abhishek Kapur',
    description: 'Based on India\'s first airstrike. The untold story of the 1965 India-Pakistan war aerial battle.',
    poster: 'https://upload.wikimedia.org/wikipedia/en/3/3e/Sky_Force_%28film%29.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: false,
    cast: ['Akshay Kumar', 'Veer Pahariya', 'Sara Ali Khan'],
  },
  {
    title: 'Chhaava',
    genre: ['Historical', 'Action', 'Drama'],
    language: ['Hindi', 'Marathi'],
    duration: 161,
    rating: 8.6,
    aiRating: 8.5,
    votes: 143000,
    releaseDate: daysAgo(2),
    certificate: 'UA',
    director: 'Laxman Utekar',
    description: 'The epic life of Chhatrapati Sambhaji Maharaj, son of the legendary Shivaji Maharaj.',
    poster: 'https://upload.wikimedia.org/wikipedia/en/0/08/Chhaava_film_poster.jpg',
    banner: '',
    isNowShowing: true,
    isComingSoon: false,
    isTrending: true,
    cast: ['Vicky Kaushal', 'Rashmika Mandanna', 'Akshaye Khanna'],
  },
  {
    title: 'Mission Impossible: The Final Reckoning',
    genre: ['Action', 'Thriller', 'Adventure'],
    language: ['English', 'Hindi'],
    duration: 169,
    rating: 0,
    aiRating: 8.8,
    votes: 0,
    releaseDate: daysAhead(30),
    certificate: 'UA',
    director: 'Christopher McQuarrie',
    description: 'Ethan Hunt faces his most impossible mission yet as he hunts down a terrifying AI weapon.',
    poster: 'https://upload.wikimedia.org/wikipedia/en/a/ac/Mission_Impossible_The_Final_Reckoning_poster.jpg',
    banner: '',
    isNowShowing: false,
    isComingSoon: true,
    isTrending: false,
    cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames', 'Simon Pegg'],
  },
  {
    title: 'Avengers: Doomsday',
    genre: ['Action', 'Sci-Fi', 'Adventure'],
    language: ['English', 'Hindi'],
    duration: 180,
    rating: 0,
    aiRating: 9.2,
    votes: 0,
    releaseDate: daysAhead(45),
    certificate: 'UA',
    director: 'Joe Russo, Anthony Russo',
    description: 'The Avengers unite to face Doctor Doom and the most catastrophic threat the universe has ever seen.',
    poster: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Avengers_Doomsday_poster.jpg',
    banner: '',
    isNowShowing: false,
    isComingSoon: true,
    isTrending: true,
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson', 'Benedict Cumberbatch'],
  },
];

mongoose.connect(URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB:', URI);
    let created = 0, updated = 0;

    for (const m of MOVIES) {
      const result = await Movie.findOneAndUpdate(
        { title: m.title },
        { $set: { ...m, userRatings: [], likes: [], dislikes: [], interests: [], isActive: true } },
        { upsert: true, new: true }
      );
      if (result.isNew) { created++; console.log(`  ✚ Created: ${m.title}`); }
      else              { updated++; console.log(`  ↺ Updated: ${m.title}`); }
    }

    console.log(`\n🎬 Movie seed complete!`);
    console.log(`   Created: ${created}   Updated: ${updated}`);
    console.log(`   Total movies: ${await Movie.countDocuments()}\n`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });
