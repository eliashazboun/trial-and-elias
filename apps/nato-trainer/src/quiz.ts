export type AlphabetEntry = {
  letter: string;
  correct: string;
  incorrect: string[];
};

export type Question = {
  letter: string;
  correct: string;
  options: string[];
};

export type Answer = {
  letter: string;
  correct: string;
  selected: string;
  isCorrect: boolean;
  timeMs: number;
};

export type QuizResult = {
  id: string;
  date: string;
  score: number;
  total: number;
  durationMs: number;
  answers: Answer[];
};

export const STORAGE_KEY = "nato-phonetic-trainer-results";

export const ALPHABET: AlphabetEntry[] = [
  {
    letter: "A",
    correct: "Alfa",
    incorrect: [
      "Apple",
      "Adam",
      "Atlas",
      "Arrow",
      "Austin",
      "April",
      "Angel",
      "Amber",
      "Apollo",
      "Archer",
    ],
  },
  {
    letter: "B",
    correct: "Bravo",
    incorrect: [
      "Baker",
      "Boston",
      "Banana",
      "Benjamin",
      "Blue",
      "Bishop",
      "Bison",
      "Berlin",
      "Butter",
      "Brooklyn",
    ],
  },
  {
    letter: "C",
    correct: "Charlie",
    incorrect: [
      "Cat",
      "Chicago",
      "Carter",
      "Copper",
      "Castle",
      "Cobra",
      "Canyon",
      "Captain",
      "Coconut",
      "Clover",
    ],
  },
  {
    letter: "D",
    correct: "Delta",
    incorrect: [
      "David",
      "Denver",
      "Dragon",
      "Daisy",
      "Dallas",
      "Diamond",
      "Dolphin",
      "Diesel",
      "Doctor",
      "Duke",
    ],
  },
  {
    letter: "E",
    correct: "Echo",
    incorrect: [
      "Edward",
      "Eagle",
      "Elephant",
      "Empire",
      "Emerald",
      "Everest",
      "Engine",
      "Elvis",
      "Explorer",
      "Edison",
    ],
  },
  {
    letter: "F",
    correct: "Foxtrot",
    incorrect: [
      "Frank",
      "Florida",
      "Falcon",
      "Forest",
      "Freddie",
      "Fisher",
      "Fire",
      "Freedom",
      "Fargo",
      "Foster",
    ],
  },
  {
    letter: "G",
    correct: "Golf",
    incorrect: [
      "George",
      "Georgia",
      "Giraffe",
      "Galaxy",
      "Garden",
      "Gordon",
      "Ghost",
      "Ginger",
      "Glacier",
      "Griffin",
    ],
  },
  {
    letter: "H",
    correct: "Hotel",
    incorrect: [
      "Harry",
      "Honda",
      "Harriet",
      "Henry",
      "Houston",
      "Hammer",
      "Hunter",
      "Harbor",
      "Horizon",
      "Hector",
    ],
  },
  {
    letter: "I",
    correct: "India",
    incorrect: [
      "Igloo",
      "Island",
      "Indiana",
      "Iron",
      "Isaac",
      "Iris",
      "Ivory",
      "Istanbul",
      "Iguana",
      "Inferno",
    ],
  },
  {
    letter: "J",
    correct: "Juliett",
    incorrect: [
      "John",
      "Jordan",
      "Jupiter",
      "Jungle",
      "Jackson",
      "Jasmine",
      "Jaguar",
      "Joker",
      "Justice",
      "Jersey",
    ],
  },
  {
    letter: "K",
    correct: "Kilo",
    incorrect: [
      "Kevin",
      "King",
      "Kansas",
      "Kangaroo",
      "Knight",
      "Kennedy",
      "Kingdom",
      "Kodiak",
      "Kettle",
      "Krypton",
    ],
  },
  {
    letter: "L",
    correct: "Lima",
    incorrect: [
      "London",
      "Lincoln",
      "Lion",
      "Larry",
      "Lemon",
      "Liberty",
      "Legend",
      "Laser",
      "Lunar",
      "Lighthouse",
    ],
  },
  {
    letter: "M",
    correct: "Mike",
    incorrect: [
      "Michael",
      "Miami",
      "Mountain",
      "Monkey",
      "Mercury",
      "Martin",
      "Mango",
      "Mustang",
      "Mason",
      "Midnight",
    ],
  },
  {
    letter: "N",
    correct: "November",
    incorrect: [
      "Nancy",
      "Nevada",
      "Nathan",
      "Ninja",
      "Nickel",
      "Napoleon",
      "Neptune",
      "Nashville",
      "Nectar",
      "North",
    ],
  },
  {
    letter: "O",
    correct: "Oscar",
    incorrect: [
      "Orange",
      "Oliver",
      "Ocean",
      "Orlando",
      "Oxygen",
      "Orbit",
      "Oasis",
      "Otter",
      "Oakland",
      "Omega",
    ],
  },
  {
    letter: "P",
    correct: "Papa",
    incorrect: [
      "Peter",
      "Paris",
      "Panda",
      "Phoenix",
      "Pilot",
      "Pepper",
      "Parker",
      "Piano",
      "Pirate",
      "Planet",
    ],
  },
  {
    letter: "Q",
    correct: "Quebec",
    incorrect: [
      "Queen",
      "Quincy",
      "Quest",
      "Quartz",
      "Quail",
      "Quentin",
      "Quiver",
      "Quasar",
      "Quokka",
      "Quill",
    ],
  },
  {
    letter: "R",
    correct: "Romeo",
    incorrect: [
      "Robert",
      "Rocket",
      "River",
      "Ranger",
      "Richard",
      "Radar",
      "Rabbit",
      "Raleigh",
      "Raven",
      "Ryder",
    ],
  },
  {
    letter: "S",
    correct: "Sierra",
    incorrect: [
      "Sam",
      "Samuel",
      "Snake",
      "Seattle",
      "Sunset",
      "Silver",
      "Saturn",
      "Shadow",
      "Spider",
      "Summit",
    ],
  },
  {
    letter: "T",
    correct: "Tango",
    incorrect: [
      "Thomas",
      "Texas",
      "Tiger",
      "Tokyo",
      "Thunder",
      "Titan",
      "Turkey",
      "Trevor",
      "Turtle",
      "Timber",
    ],
  },
  {
    letter: "U",
    correct: "Uniform",
    incorrect: [
      "Uncle",
      "Utah",
      "Umbrella",
      "Universe",
      "Union",
      "Urban",
      "Utopia",
      "Ultra",
      "Unity",
      "Uranus",
    ],
  },
  {
    letter: "V",
    correct: "Victor",
    incorrect: [
      "Violet",
      "Virginia",
      "Venus",
      "Viking",
      "Valley",
      "Vincent",
      "Viper",
      "Velvet",
      "Voyager",
      "Vermont",
    ],
  },
  {
    letter: "W",
    correct: "Whiskey",
    incorrect: [
      "William",
      "Washington",
      "Winter",
      "Wolf",
      "Walter",
      "Wagon",
      "Willow",
      "Winston",
      "Warrior",
      "Wilson",
    ],
  },
  {
    letter: "X",
    correct: "X-ray",
    incorrect: [
      "Xavier",
      "Xylophone",
      "Xenon",
      "Xerox",
      "Xylem",
      "Xeric",
      "Xenial",
      "Xiphoid",
      "Xenolith",
      "Xanthic",
    ],
  },
  {
    letter: "Y",
    correct: "Yankee",
    incorrect: [
      "Yellow",
      "Yard",
      "Yogurt",
      "Yosemite",
      "Yacht",
      "Yonder",
      "York",
      "Yarrow",
      "Yeti",
      "Yvonne",
    ],
  },
  {
    letter: "Z",
    correct: "Zulu",
    incorrect: [
      "Zebra",
      "Zero",
      "Zephyr",
      "Zigzag",
      "Zodiac",
      "Zombie",
      "Zenith",
      "Zorro",
      "Zipper",
      "Zurich",
    ],
  },
];

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const item = result[i]!;
    result[i] = result[j]!;
    result[j] = item;
  }

  return result;
}

export function generateQuestions(): Question[] {
  return shuffle(ALPHABET).map((entry) => ({
    letter: entry.letter,
    correct: entry.correct,
    options: shuffle([entry.correct, ...shuffle(entry.incorrect).slice(0, 2)]),
  }));
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}
