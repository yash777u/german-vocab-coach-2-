export interface VocabWord {
  german_word: string;
  pronunciation: string;
  meaning: string;
  example_sentence: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  gender?: string;
  emoji?: string;
  keyword: string;
  note?: string;
}

export interface VocabLevel {
  id: string;
  name: string;
  days: {
    [dayName: string]: VocabWord[];
  };
}

export const PRELOADED_LEVELS: VocabLevel[] = [
  {
    id: "german_verbs_adjectives",
    name: "German Verbs & Adjectives (Sample 1)",
    days: {
      "Day 1": [
        {
          german_word: "bleib",
          pronunciation: "blaib",
          meaning: "stay",
          example_sentence: "Bitte bleib hier.",
          option_1: "go",
          option_2: "stay",
          option_3: "run",
          option_4: "sleep",
          gender: "verb",
          emoji: "🛑",
          keyword: "stay sign",
          note: "Verb"
        },
        {
          german_word: "stehen",
          pronunciation: "shtay-en",
          meaning: "to stand",
          example_sentence: "Ich stehe hier.",
          option_1: "sit",
          option_2: "run",
          option_3: "stand",
          option_4: "sleep",
          gender: "verb",
          emoji: "🧍",
          keyword: "standing person",
          note: "Verb"
        },
        {
          german_word: "denken",
          pronunciation: "denk-en",
          meaning: "to think",
          example_sentence: "Ich denke viel.",
          option_1: "think",
          option_2: "eat",
          option_3: "sleep",
          option_4: "drive",
          gender: "verb",
          emoji: "💡",
          keyword: "thinking person",
          note: "Verb"
        },
        {
          german_word: "vor",
          pronunciation: "for",
          meaning: "before / in front of",
          example_sentence: "Er steht vor dem Haus.",
          option_1: "behind",
          option_2: "before",
          option_3: "under",
          option_4: "over",
          gender: "preposition",
          emoji: "➡️",
          keyword: "in front",
          note: "Preposition"
        },
        {
          german_word: "hübsch",
          pronunciation: "hoobsh",
          meaning: "pretty",
          example_sentence: "Das Mädchen ist hübsch.",
          option_1: "ugly",
          option_2: "tall",
          option_3: "pretty",
          option_4: "old",
          gender: "adjective",
          emoji: "🌸",
          keyword: "pretty girl",
          note: "Adjective"
        },
        {
          german_word: "besten",
          pronunciation: "bes-ten",
          meaning: "best",
          example_sentence: "Das ist am besten.",
          option_1: "worst",
          option_2: "better",
          option_3: "best",
          option_4: "small",
          gender: "adjective",
          emoji: "🏆",
          keyword: "trophy",
          note: "Adjective"
        },
        {
          german_word: "aussieht",
          pronunciation: "ows-zeet",
          meaning: "looks / appears",
          example_sentence: "Er sieht gut aus.",
          option_1: "looks",
          option_2: "runs",
          option_3: "eats",
          option_4: "writes",
          gender: "verb",
          emoji: "👁️",
          keyword: "looking",
          note: "Verb"
        },
        {
          german_word: "arm",
          pronunciation: "arm",
          meaning: "poor",
          example_sentence: "Der Mann ist arm.",
          option_1: "rich",
          option_2: "poor",
          option_3: "tall",
          option_4: "young",
          gender: "adjective",
          emoji: "🪙",
          keyword: "poor person",
          note: "Adjective"
        },
        {
          german_word: "echt",
          pronunciation: "ekht",
          meaning: "real / really",
          example_sentence: "Das ist echt gut.",
          option_1: "fake",
          option_2: "real",
          option_3: "old",
          option_4: "new",
          gender: "adjective",
          emoji: "✅",
          keyword: "real stamp",
          note: "Adjective"
        },
        {
          german_word: "süß",
          pronunciation: "zues",
          meaning: "sweet / cute",
          example_sentence: "Der Hund ist süß.",
          option_1: "sour",
          option_2: "bitter",
          option_3: "sweet",
          option_4: "salty",
          gender: "adjective",
          emoji: "🧸",
          keyword: "cute puppy",
          note: "Adjective"
        }
      ],
      "Day 2": [
        {
          german_word: "schon",
          pronunciation: "shohn",
          meaning: "already",
          example_sentence: "Ich habe schon gegessen.",
          option_1: "never",
          option_2: "already",
          option_3: "later",
          option_4: "tomorrow",
          gender: "adverb",
          emoji: "⏰",
          keyword: "finished",
          note: "Adverb"
        },
        {
          german_word: "hör",
          pronunciation: "hoer",
          meaning: "listen",
          example_sentence: "Bitte hör zu.",
          option_1: "sleep",
          option_2: "listen",
          option_3: "run",
          option_4: "jump",
          gender: "verb",
          emoji: "👂",
          keyword: "listening ear",
          note: "Verb"
        },
        {
          german_word: "derzeit",
          pronunciation: "dayr-tsite",
          meaning: "currently",
          example_sentence: "Ich arbeite derzeit hier.",
          option_1: "now",
          option_2: "currently",
          option_3: "yesterday",
          option_4: "soon",
          gender: "adverb",
          emoji: "📅",
          keyword: "calendar",
          note: "Adverb"
        },
        {
          german_word: "verlagern",
          pronunciation: "fer-lah-gern",
          meaning: "to shift / move",
          example_sentence: "Wir verlagern das Projekt.",
          option_1: "stop",
          option_2: "shift",
          option_3: "move",
          option_4: "sell",
          gender: "verb",
          emoji: "📦",
          keyword: "moving boxes",
          note: "Verb"
        },
        {
          german_word: "auf",
          pronunciation: "owf",
          meaning: "on / onto",
          example_sentence: "Das Buch liegt auf dem Tisch.",
          option_1: "under",
          option_2: "on",
          option_3: "in",
          option_4: "between",
          gender: "preposition",
          emoji: "⬆️",
          keyword: "on top",
          note: "Preposition"
        },
        {
          german_word: "solltest",
          pronunciation: "zol-test",
          meaning: "should",
          example_sentence: "Du solltest lernen.",
          option_1: "must",
          option_2: "should",
          option_3: "can",
          option_4: "will",
          gender: "verb",
          emoji: "🙋",
          keyword: "advice",
          note: "Modal Verb"
        },
        {
          german_word: "Idioten",
          pronunciation: "idi-oh-ten",
          meaning: "idiots",
          example_sentence: "Die Idioten lachen laut.",
          option_1: "teachers",
          option_2: "friends",
          option_3: "idiots",
          option_4: "doctors",
          gender: "noun",
          emoji: "🤪",
          keyword: "idiot",
          note: "Noun (Plural)"
        },
        {
          german_word: "nur",
          pronunciation: "noor",
          meaning: "only",
          example_sentence: "Ich habe nur einen Euro.",
          option_1: "all",
          option_2: "only",
          option_3: "many",
          option_4: "none",
          gender: "adverb",
          emoji: "1️⃣",
          keyword: "only one",
          note: "Adverb"
        },
        {
          german_word: "einfach",
          pronunciation: "ine-fakh",
          meaning: "simple / easy",
          example_sentence: "Deutsch ist einfach.",
          option_1: "difficult",
          option_2: "simple",
          option_3: "expensive",
          option_4: "long",
          gender: "adjective",
          emoji: "🟢",
          keyword: "easy button",
          note: "Adjective"
        },
        {
          german_word: "jetzt",
          pronunciation: "yetst",
          meaning: "now",
          example_sentence: "Ich gehe jetzt nach Hause.",
          option_1: "yesterday",
          option_2: "now",
          option_3: "tomorrow",
          option_4: "later",
          gender: "adverb",
          emoji: "⏰",
          keyword: "clock now",
          note: "Adverb"
        }
      ]
    }
  },
  {
    id: "german_genders_nouns",
    name: "German Genders & Nouns (Sample 2)",
    days: {
      "Day 1": [
        {
          german_word: "der Vater",
          pronunciation: "vAH-tah",
          meaning: "the father",
          example_sentence: "Mein Vater arbeitet viel.",
          option_1: "August",
          option_2: "Goodbye",
          option_3: "the father",
          option_4: "to drink (water)",
          gender: "der",
          emoji: "👨",
          keyword: "father dad",
          note: "Noun • Singular"
        },
        {
          german_word: "das Eis",
          pronunciation: "ice",
          meaning: "the ice cream",
          example_sentence: "Das Eis schmeckt gut.",
          option_1: "Summer",
          option_2: "Have a nice day",
          option_3: "Before (to the hour)",
          option_4: "the ice cream",
          gender: "das",
          emoji: "🍨",
          keyword: "ice cream sundae",
          note: "Noun • Singular"
        },
        {
          german_word: "die Tür",
          pronunciation: "t-yur",
          meaning: "the door",
          example_sentence: "Die Tür ist offen.",
          option_1: "to drink (beer)",
          option_2: "15 Minutes Past",
          option_3: "the door",
          option_4: "August",
          gender: "die",
          emoji: "🚪",
          keyword: "door wooden",
          note: "Noun • Singular"
        },
        {
          german_word: "das Tor",
          pronunciation: "tohr",
          meaning: "the gate / barrier",
          example_sentence: "Das Tor ist geschlossen.",
          option_1: "Very good",
          option_2: "to ask",
          option_3: "the gate / barrier",
          option_4: "October",
          gender: "das",
          emoji: "🚧",
          keyword: "gate barrier",
          note: "Noun • Singular"
        },
        {
          german_word: "die Hose",
          pronunciation: "HOH-zeh",
          meaning: "the trousers / pants",
          example_sentence: "Die Hose ist blau.",
          option_1: "Good morning",
          option_2: "Good evening",
          option_3: "to do/make",
          option_4: "the trousers / pants",
          gender: "die",
          emoji: "👖",
          keyword: "pants trousers",
          note: "Noun • Singular"
        },
        {
          german_word: "der Stern",
          pronunciation: "shtern",
          meaning: "the star",
          example_sentence: "Der Stern leuchtet hell.",
          option_1: "15 Minutes Past",
          option_2: "to do/make",
          option_3: "the star",
          option_4: "to hear/listen",
          gender: "der",
          emoji: "⭐",
          keyword: "star space",
          note: "Noun • Singular"
        },
        {
          german_word: "die Sonne",
          pronunciation: "ZOH-neh",
          meaning: "the sun",
          example_sentence: "Die Sonne scheint heute.",
          option_1: "the ice cream",
          option_2: "the sun",
          option_3: "I am doing...",
          option_4: "North",
          gender: "die",
          emoji: "☀️",
          keyword: "sun sunlight",
          note: "Noun • Singular"
        },
        {
          german_word: "der Mond",
          pronunciation: "mohnt",
          meaning: "the moon",
          example_sentence: "Der Mond ist heute voll.",
          option_1: "the moon",
          option_2: "to cook",
          option_3: "the ball",
          option_4: "the lamp",
          gender: "der",
          emoji: "🌙",
          keyword: "moon crescent night",
          note: "Noun • Singular"
        },
        {
          german_word: "der Himmel",
          pronunciation: "HIM-el",
          meaning: "the sky / heaven",
          example_sentence: "Der Himmel ist blau.",
          option_1: "the sky / heaven",
          option_2: "January",
          option_3: "Winter",
          option_4: "the window",
          gender: "der",
          emoji: "☁️",
          keyword: "sky clouds",
          note: "Noun • Singular"
        },
        {
          german_word: "der Bleistift",
          pronunciation: "BLY-shtift",
          meaning: "the pencil",
          example_sentence: "Ich brauche einen Bleistift.",
          option_1: "How are you? (Formal)",
          option_2: "the T-Shirt",
          option_3: "West",
          option_4: "the pencil",
          gender: "der",
          emoji: "✏️",
          keyword: "wooden pencil",
          note: "Noun • Singular"
        }
      ],
      "Day 2": [
        {
          german_word: "die Pflanze",
          pronunciation: "PFLAN-tseh",
          meaning: "the plant",
          example_sentence: "Die Pflanze braucht Wasser.",
          option_1: "the plant",
          option_2: "the chocolate",
          option_3: "Autumn / Fall",
          option_4: "March",
          gender: "die",
          emoji: "🪴",
          keyword: "houseplant potted",
          note: "Noun • Singular"
        },
        {
          german_word: "das T-Shirt",
          pronunciation: "TEE-shurt",
          meaning: "the T-Shirt",
          example_sentence: "Das T-Shirt ist rot.",
          option_1: "I am doing...",
          option_2: "May",
          option_3: "the T-Shirt",
          option_4: "How are you? (Formal)",
          gender: "das",
          emoji: "👕",
          keyword: "tshirt",
          note: "Noun • Singular"
        },
        {
          german_word: "das Sofa",
          pronunciation: "ZOH-fah",
          meaning: "the sofa / couch",
          example_sentence: "Das Sofa ist sehr bequem.",
          option_1: "the sofa / couch",
          option_2: "the dog",
          option_3: "Good",
          option_4: "15 Minutes To",
          gender: "das",
          emoji: "🛋️",
          keyword: "sofa couch",
          note: "Noun • Singular"
        },
        {
          german_word: "der Stift",
          pronunciation: "shtift",
          meaning: "the pen",
          example_sentence: "Hast du einen Stift?",
          option_1: "the chocolate",
          option_2: "the pen",
          option_3: "the window",
          option_4: "the door",
          gender: "der",
          emoji: "🖋️",
          keyword: "fountain pen",
          note: "Noun • Singular"
        },
        {
          german_word: "das Heft",
          pronunciation: "heft",
          meaning: "the notebook",
          example_sentence: "Das Heft ist auf dem Tisch.",
          option_1: "the table",
          option_2: "the notebook",
          option_3: "the sky / heaven",
          option_4: "the teacher (male)",
          gender: "das",
          emoji: "📒",
          keyword: "notebook spiral",
          note: "Noun • Singular"
        },
        {
          german_word: "der Bonbon",
          pronunciation: "BONG-bong",
          meaning: "the candy / bonbon",
          example_sentence: "Der Bonbon ist süß.",
          option_1: "the star",
          option_2: "the candy / bonbon",
          option_3: "the clock / watch",
          option_4: "the house",
          gender: "der",
          emoji: "🍬",
          keyword: "hard candy",
          note: "Noun • Singular"
        },
        {
          german_word: "der Fisch",
          pronunciation: "fish",
          meaning: "the fish",
          example_sentence: "Der Fisch schwimmt im Wasser.",
          option_1: "the room",
          option_2: "Bye",
          option_3: "the fish",
          option_4: "May",
          gender: "der",
          emoji: "🐟",
          keyword: "fish swimming",
          note: "Noun • Singular"
        },
        {
          german_word: "die Blume",
          pronunciation: "BLOO-meh",
          meaning: "the flower",
          example_sentence: "Die Blume ist schön.",
          option_1: "the chocolate",
          option_2: "the flower",
          option_3: "30 Minutes Past (Half)",
          option_4: "the gate / barrier",
          gender: "die",
          emoji: "🌸",
          keyword: "flower blossom",
          note: "Noun • Singular"
        },
        {
          german_word: "der Ball",
          pronunciation: "bahl",
          meaning: "the ball",
          example_sentence: "Der Ball ist rund.",
          option_1: "the dog",
          option_2: "you (informal)",
          option_3: "Good",
          option_4: "the ball",
          gender: "der",
          emoji: "⚽",
          keyword: "soccer ball",
          note: "Noun • Singular"
        },
        {
          german_word: "die Lampe",
          pronunciation: "LAHM-peh",
          meaning: "the lamp",
          example_sentence: "Die Lampe ist an.",
          option_1: "Summer",
          option_2: "the father",
          option_3: "they / You (formal)",
          option_4: "the lamp",
          gender: "die",
          emoji: "💡",
          keyword: "lamp lightbulb",
          note: "Noun • Singular"
        }
      ]
    }
  }
];
