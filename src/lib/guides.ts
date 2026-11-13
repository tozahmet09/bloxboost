// Evergreen guides for small Roblox developers. They answer what devs search for on Google
// ("how to get players on my roblox game") and point to Spawnswap as one of the options.
// Keep claims factual: no made-up numbers, no promises of results.

export type GuideSection = { h: string; p?: string[]; list?: string[] };
export type Guide = {
  slug: string;
  title: string;
  description: string;
  updated: string; // YYYY-MM-DD
  intro: string;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-get-players-on-your-roblox-game",
    title: "How to get your first players on a new Roblox game",
    description:
      "Your Roblox game is live but nobody plays it. Seven free and cheap ways small developers get their first real players, and what to do once they arrive.",
    updated: "2026-11-11",
    intro:
      "Publishing a game is the easy part. The hard part is the first 50 players: Roblox recommends games that already keep players, so a game with zero players tends to stay at zero. Here is what actually moves a new game, starting with the free options.",
    sections: [
      {
        h: "1. Fix the first 60 seconds before you bring anyone",
        p: [
          "Every player you bring is wasted if they leave in the first minute. Before any promotion, play your own game as a stranger would: is it clear what to do, is there something fun within 30 seconds, does the icon match what is inside?",
          "A clear icon and thumbnail matter as much as the game itself, because that is all people see before they click.",
        ],
      },
      {
        h: "2. Ask friends and family, but for feedback, not numbers",
        p: [
          "Your first 5 to 10 players should be people who will tell you the truth. Watch them play if you can. Where they get stuck is your to-do list.",
        ],
      },
      {
        h: "3. Post short videos of the game",
        p: [
          "TikTok and YouTube Shorts are where most Roblox players find new games. A 15 to 30 second clip that shows the most fun moment, not the menu, works better than a polished trailer.",
          "Post regularly. One video rarely does it; ten videos over two weeks often does.",
        ],
      },
      {
        h: "4. Share it in developer communities, the right way",
        p: [
          "Reddit communities like r/robloxgamedev and Discord servers for Roblox developers usually have a self-promotion channel or a weekly thread. Post there, follow each server's rules, and ask for feedback instead of just dropping a link.",
          "Do not send cold DMs to people you don't know. Most servers ban it, and it rarely works.",
        ],
      },
      {
        h: "5. Swap plays with other developers",
        p: [
          "Other small developers have the same problem you do. A play swap means you play their game and they (or someone else) play yours. You get real players and real feedback, and it costs nothing but time.",
          "Spawnswap is built around this: play another developer's game for 10 minutes to earn 1 credit, then spend credits to get real players on your own game. Plays are checked with Roblox, so there are no bots.",
        ],
      },
      {
        h: "6. Run small Roblox ads once the game keeps players",
        p: [
          "Roblox's own ads (Ads Manager) can work, but they usually need a steady daily budget before the results are useful. Spend on ads only after your game keeps the players you already get, otherwise you pay to show people a game they leave.",
        ],
      },
      {
        h: "7. Update often and tell people",
        p: [
          "An update is a reason to post again. Players who left come back for new content, and every update gives you a new video to share.",
        ],
      },
      {
        h: "What to watch",
        list: [
          "Average play time: are people staying longer after each update?",
          "Return rate: do players come back the next day?",
          "Ratings and feedback: what do several people say?",
        ],
      },
    ],
  },
  {
    slug: "how-to-get-feedback-on-your-roblox-game",
    title: "How to get honest feedback on your Roblox game",
    description:
      "Friends say it's great, strangers leave in a minute. How small Roblox developers get honest, useful feedback from real players, and what to do with it.",
    updated: "2026-11-11",
    intro:
      "Most new Roblox games don't fail because of bad ideas. They fail because nobody told the developer what was confusing or boring early enough. Feedback from real players is the cheapest way to fix that.",
    sections: [
      {
        h: "Why friends are not enough",
        p: [
          "People who know you want to be nice. They also already know what the game is supposed to be. You need players who arrive with no context, like a real player from the Discover page would.",
        ],
      },
      {
        h: "Ask specific questions",
        list: [
          "When did you first feel bored or confused?",
          "What did you think the goal was?",
          "Would you play again tomorrow? Why or why not?",
          "What is the one thing you would change?",
        ],
      },
      {
        h: "Where to find players who will tell you the truth",
        list: [
          "Feedback threads in developer communities (r/robloxgamedev, Roblox developer Discord servers).",
          "Other developers. They know what to look for and they will be honest, especially if you review their game too.",
          "Play-swap sites like Spawnswap, where every player plays your game for 10 minutes and can leave a star rating.",
        ],
      },
      {
        h: "What to do with it",
        p: [
          "Look for patterns, not single opinions. If one person dislikes the colors, note it. If five people get lost in the same spot, fix it this week.",
          "After each fix, get a few new players and check if the same problem comes up again.",
        ],
      },
    ],
  },
  {
    slug: "how-to-promote-a-roblox-game-with-no-budget",
    title: "How to promote a Roblox game with no budget",
    description:
      "No Robux for ads? A free promotion plan for small Roblox developers: short videos, communities, play swaps and updates, step by step.",
    updated: "2026-11-11",
    intro:
      "You don't need a big ad budget to get your first players. You need a game that holds people for a few minutes, and a steady way to put it in front of new eyes. This is a free plan you can run in about 20 minutes a day.",
    sections: [
      {
        h: "Week 1: get ready",
        list: [
          "Make a clear icon and 2 to 3 thumbnails that show gameplay.",
          "Record 5 short clips of the most fun moments.",
          "Write one sentence that says what the game is. Use it everywhere.",
        ],
      },
      {
        h: "Week 2: start posting",
        list: [
          "Post one short video a day on TikTok or YouTube Shorts.",
          "Share the game once in the self-promotion channel of 2 or 3 developer communities.",
          "Get your first 10 to 20 outside players through a play swap and read every review.",
        ],
      },
      {
        h: "Week 3: fix and repeat",
        list: [
          "Fix the top problem from the reviews.",
          "Post the update as a new video.",
          "Keep the clips that got the most views and make more like them.",
        ],
      },
      {
        h: "What not to do",
        list: [
          "Don't buy fake players or bots. Roblox can remove them and they teach you nothing.",
          "Don't spam links or send cold DMs. It gets you banned from the communities you need.",
          "Don't promise Robux or items to people for playing. It breaks Roblox's rules.",
        ],
      },
      {
        h: "Where Spawnswap fits",
        p: [
          "Spawnswap is a free play swap for Roblox developers. You play other developers' games for 10 minutes to earn credits, then spend credits to get real players on your own game. Credit packs exist if you want to skip the playing, but earning is always free.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
