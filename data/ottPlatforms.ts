
export interface Platform {
  id: string;
  name: string;
  logo: any;
  color: string;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  poster: string;
  releaseYear: number;
  imdbRating: number;
  genre: string[];
  type: 'movie' | 'series';
  platform: string;
  trailerUrl: string;
  downloadUrl: string;
  seasons?: Season[];
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  description: string;
  duration: string;
}

export const platforms: Platform[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    logo: require('../assets/images/netflix-logo.png'),
    color: '#E50914',
  },
  {
    id: 'prime',
    name: 'Amazon Prime',
    logo: require('../assets/images/prime-logo.png'),
    color: '#00A8E1',
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    logo: require('../assets/images/hotstar-logo.png'),
    color: '#1F80E0',
  },
  {
    id: 'sonyliv',
    name: 'SonyLIV',
    logo: require('../assets/images/sonyliv-logo.png'),
    color: '#7B68EE',
  },
  {
    id: 'zee5',
    name: 'ZEE5',
    logo: require('../assets/images/zee5-logo.png'),
    color: '#6C5CE7',
  },
];

export const contentData: Content[] = [
  {
    id: '1',
    title: 'Stranger Things',
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    releaseYear: 2016,
    imdbRating: 8.7,
    genre: ['Sci-Fi', 'Horror', 'Drama'],
    type: 'series',
    platform: 'netflix',
    trailerUrl: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
    downloadUrl: 'https://example.com/download/stranger-things',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'st1e1',
            title: 'The Vanishing of Will Byers',
            episodeNumber: 1,
            description: 'On his way home from a friend\'s house, young Will sees something terrifying.',
            duration: '47m',
          },
          {
            id: 'st1e2',
            title: 'The Weirdo on Maple Street',
            episodeNumber: 2,
            description: 'Lucas, Mike and Dustin try to talk to the girl they found in the woods.',
            duration: '55m',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'The Boys',
    description: 'A group of vigilantes set out to take down corrupt superheroes.',
    poster: 'https://image.tmdb.org/t/p/w500/stTEycfG9928HYGEISBFaG1ngjM.jpg',
    releaseYear: 2019,
    imdbRating: 8.8,
    genre: ['Action', 'Comedy', 'Crime'],
    type: 'series',
    platform: 'prime',
    trailerUrl: 'https://www.youtube.com/watch?v=tcrNsIaQkb4',
    downloadUrl: 'https://example.com/download/the-boys',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'tb1e1',
            title: 'The Name of the Game',
            episodeNumber: 1,
            description: 'When a Supe kills the love of his life, A/V salesman Hughie Campbell teams up with Billy Butcher.',
            duration: '61m',
          },
          {
            id: 'tb1e2',
            title: 'Cherry',
            episodeNumber: 2,
            description: 'The Boys get themselves a Superhero, Starlight gets payback, Homelander gets naughty.',
            duration: '59m',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'Avengers: Endgame',
    description: 'After the devastating events of Infinity War, the universe is in ruins.',
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    releaseYear: 2019,
    imdbRating: 8.4,
    genre: ['Action', 'Adventure', 'Drama'],
    type: 'movie',
    platform: 'hotstar',
    trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    downloadUrl: 'https://example.com/download/avengers-endgame',
  },
  {
    id: '4',
    title: 'Scam 1992',
    description: 'The story of Harshad Mehta, a stockbroker who single-handedly took the stock market to dizzying heights.',
    poster: 'https://image.tmdb.org/t/p/w500/3YNlYeFsOMNRqN0zcVw4ZqSF8V5.jpg',
    releaseYear: 2020,
    imdbRating: 9.6,
    genre: ['Drama', 'Biography', 'Crime'],
    type: 'series',
    platform: 'sonyliv',
    trailerUrl: 'https://www.youtube.com/watch?v=c3_GGKbcXdE',
    downloadUrl: 'https://example.com/download/scam-1992',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'sc1e1',
            title: 'Dalal Street Ka Dil',
            episodeNumber: 1,
            description: 'Harshad Mehta starts his journey in the stock market.',
            duration: '49m',
          },
          {
            id: 'sc1e2',
            title: 'Risk Hai Toh Ishq Hai',
            episodeNumber: 2,
            description: 'Harshad discovers the ready forward deal.',
            duration: '52m',
          },
        ],
      },
    ],
  },
  {
    id: '5',
    title: 'The Family Man',
    description: 'A middle-class man secretly works for the National Investigation Agency.',
    poster: 'https://image.tmdb.org/t/p/w500/dEjkp9vLpjOB3gjnZVwEAsNYlrS.jpg',
    releaseYear: 2019,
    imdbRating: 8.9,
    genre: ['Action', 'Drama', 'Thriller'],
    type: 'series',
    platform: 'prime',
    trailerUrl: 'https://www.youtube.com/watch?v=7Q8nICiMZVw',
    downloadUrl: 'https://example.com/download/the-family-man',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            id: 'tfm1e1',
            title: 'The Man in the Family',
            episodeNumber: 1,
            description: 'Srikant Tiwari is trying to balance his family and his job as an intelligence officer.',
            duration: '49m',
          },
        ],
      },
    ],
  },
];
