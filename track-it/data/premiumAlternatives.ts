export interface AlternativeProblem {
  platform: string;
  title: string;
  url: string;
  // Optional because generated search-fallback entries (see
  // buildSearchAlternatives below) don't have a known difficulty - only
  // curated PREMIUM_ALTERNATIVES entries set this.
  difficulty?: "Easy" | "Medium" | "Hard";
  note?: string;
  // True for a generated "search this platform" link (no confirmed match),
  // as opposed to a curated, verified alternative below. The UI uses this to
  // avoid presenting a search link as if it were a confirmed result.
  isSearch?: boolean;
}

export interface PremiumAlternative {
  leetcodeId: number;
  leetcodeSlug: string;
  leetcodeTitle: string;
  alternatives: AlternativeProblem[];
}

export const PREMIUM_ALTERNATIVES: PremiumAlternative[] = [
  {
    leetcodeId: 1,
    leetcodeSlug: "two-sum",
    leetcodeTitle: "Two Sum",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Find pair with given sum",
        url: "https://www.geeksforgeeks.org/find-a-pair-with-given-sum-in-bst/",
        difficulty: "Easy"
      },
      {
        platform: "HackerRank",
        title: "Pairs",
        url: "https://www.hackerrank.com/challenges/pairs/problem",
        difficulty: "Easy"
      },
      {
        platform: "Codeforces",
        title: "A. Two Sum (similar)",
        url: "https://codeforces.com/problemset/problem/1730/A",
        difficulty: "Easy",
        note: "Different variation"
      }
    ]
  },
  {
    leetcodeId: 2,
    leetcodeSlug: "add-two-numbers",
    leetcodeTitle: "Add Two Numbers",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Add two numbers represented by linked lists",
        url: "https://www.geeksforgeeks.org/add-two-numbers-represented-by-linked-lists/",
        difficulty: "Medium"
      },
      {
        platform: "InterviewBit",
        title: "Add Two Numbers as Lists",
        url: "https://www.interviewbit.com/problems/add-two-numbers-as-lists/",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 3,
    leetcodeSlug: "longest-substring-without-repeating-characters",
    leetcodeTitle: "Longest Substring Without Repeating Characters",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Longest substring without repeating characters",
        url: "https://www.geeksforgeeks.org/longest-substring-without-repeating-characters/",
        difficulty: "Medium"
      },
      {
        platform: "Codeforces",
        title: "C. Longest Substring Without Repeating Characters",
        url: "https://codeforces.com/problemset/problem/1791/C",
        difficulty: "Medium",
        note: "Similar concept"
      }
    ]
  },
  {
    leetcodeId: 5,
    leetcodeSlug: "longest-palindromic-substring",
    leetcodeTitle: "Longest Palindromic Substring",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Longest Palindromic Substring",
        url: "https://www.geeksforgeeks.org/longest-palindromic-substring-set-2/",
        difficulty: "Medium"
      },
      {
        platform: "Codeforces",
        title: "Palindromic Substrings",
        url: "https://codeforces.com/problemset/problem/7/Problem",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 10,
    leetcodeSlug: "regular-expression-matching",
    leetcodeTitle: "Regular Expression Matching",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Wildcard Pattern Matching",
        url: "https://www.geeksforgeeks.org/wildcard-pattern-matching/",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 11,
    leetcodeSlug: "container-with-most-water",
    leetcodeTitle: "Container With Most Water",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Container With Most Water",
        url: "https://www.geeksforgeeks.org/container-with-most-water/",
        difficulty: "Medium"
      },
      {
        platform: "Codeforces",
        title: "Water Container Problem",
        url: "https://codeforces.com/problemset/problem/1195/C",
        difficulty: "Medium",
        note: "Related concept"
      }
    ]
  },
  {
    leetcodeId: 15,
    leetcodeSlug: "3sum",
    leetcodeTitle: "3Sum",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Find all triplets with zero sum",
        url: "https://www.geeksforgeeks.org/find-triplets-array-whose-sum-equal-zero/",
        difficulty: "Medium"
      },
      {
        platform: "HackerRank",
        title: "3Sum Problem",
        url: "https://www.hackerrank.com/challenges/3sum/problem",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 42,
    leetcodeSlug: "trapping-rain-water",
    leetcodeTitle: "Trapping Rain Water",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Trapping rain water",
        url: "https://www.geeksforgeeks.org/trapping-rain-water/",
        difficulty: "Hard"
      },
      {
        platform: "Codeforces",
        title: "Rain Water Trapping",
        url: "https://codeforces.com/problemset/problem/1428/C",
        difficulty: "Hard",
        note: "Different variation"
      }
    ]
  },
  {
    leetcodeId: 76,
    leetcodeSlug: "minimum-window-substring",
    leetcodeTitle: "Minimum Window Substring",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Smallest window containing all characters",
        url: "https://www.geeksforgeeks.org/find-the-smallest-window-in-a-string-containing-all-characters-of-another-string/",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 124,
    leetcodeSlug: "binary-tree-maximum-path-sum",
    leetcodeTitle: "Binary Tree Maximum Path Sum",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Maximum Path Sum in Binary Tree",
        url: "https://www.geeksforgeeks.org/find-maximum-path-sum-in-a-binary-tree/",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 146,
    leetcodeSlug: "lru-cache",
    leetcodeTitle: "LRU Cache",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "LRU Cache Implementation",
        url: "https://www.geeksforgeeks.org/lru-cache-implementation/",
        difficulty: "Medium"
      },
      {
        platform: "InterviewBit",
        title: "LRU Cache",
        url: "https://www.interviewbit.com/problems/lru-cache/",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 200,
    leetcodeSlug: "number-of-islands",
    leetcodeTitle: "Number of Islands",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Find the number of islands",
        url: "https://www.geeksforgeeks.org/find-number-of-islands/",
        difficulty: "Medium"
      },
      {
        platform: "Codeforces",
        title: "Islands Problem",
        url: "https://codeforces.com/problemset/problem/196/B",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 208,
    leetcodeSlug: "implement-trie-prefix-tree",
    leetcodeTitle: "Implement Trie (Prefix Tree)",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Trie Insert and Search",
        url: "https://www.geeksforgeeks.org/trie-insert-and-search/",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 212,
    leetcodeSlug: "word-search-ii",
    leetcodeTitle: "Word Search II",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Word Search in Grid",
        url: "https://www.geeksforgeeks.org/word-search-in-a-grid/",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 239,
    leetcodeSlug: "sliding-window-maximum",
    leetcodeTitle: "Sliding Window Maximum",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Maximum of all subarrays of size k",
        url: "https://www.geeksforgeeks.org/sliding-window-maximum-maximum-of-all-subarrays-of-size-k/",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 297,
    leetcodeSlug: "serialize-and-deserialize-binary-tree",
    leetcodeTitle: "Serialize and Deserialize Binary Tree",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Serialize and Deserialize Binary Tree",
        url: "https://www.geeksforgeeks.org/serialize-deserialize-binary-tree/",
        difficulty: "Hard"
      }
    ]
  },
  {
    leetcodeId: 300,
    leetcodeSlug: "longest-increasing-subsequence",
    leetcodeTitle: "Longest Increasing Subsequence",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Longest Increasing Subsequence",
        url: "https://www.geeksforgeeks.org/longest-increasing-subsequence-dp-3/",
        difficulty: "Medium"
      },
      {
        platform: "Codeforces",
        title: "LIS Problem",
        url: "https://codeforces.com/problemset/problem/1313/C1",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 322,
    leetcodeSlug: "coin-change",
    leetcodeTitle: "Coin Change",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Coin Change Problem",
        url: "https://www.geeksforgeeks.org/coin-change-dp-7/",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 424,
    leetcodeSlug: "longest-repeating-character-replacement",
    leetcodeTitle: "Longest Repeating Character Replacement",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Longest substring with same characters after k changes",
        url: "https://www.geeksforgeeks.org/longest-substring-same-characters-k-replacements/",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 763,
    leetcodeSlug: "partition-labels",
    leetcodeTitle: "Partition Labels",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Partition Labels",
        url: "https://www.geeksforgeeks.org/partition-labels/",
        difficulty: "Medium"
      }
    ]
  },
  {
    leetcodeId: 875,
    leetcodeSlug: "koko-eating-bananas",
    leetcodeTitle: "Koko Eating Bananas",
    alternatives: [
      {
        platform: "GeeksforGeeks",
        title: "Koko Eating Bananas",
        url: "https://www.geeksforgeeks.org/koko-eating-bananas/",
        difficulty: "Medium"
      }
    ]
  }
];

export function getAlternativesForProblem(slug: string, title?: string): PremiumAlternative | undefined {
  let match = PREMIUM_ALTERNATIVES.find(alt => alt.leetcodeSlug === slug);
  if (!match && title) {
    match = PREMIUM_ALTERNATIVES.find(alt => 
      alt.leetcodeTitle.toLowerCase() === title.toLowerCase()
    );
  }
  return match;
}

export function isKnownPremiumProblem(slug: string, title?: string): boolean {
  return !!getAlternativesForProblem(slug, title);
}

// Strip a leading "123. " problem number the way LeetCode titles include it,
// so search queries read naturally (matches the same stripping already done
// for the YouTube search query in HelpButton.tsx).
function cleanTitleForSearch(title: string): string {
  return title.replace(/^\d+\.?\s+/, "").trim();
}

// Fallback discovery for problems with no curated PREMIUM_ALTERNATIVES entry
// (the overwhelming majority of LeetCode problems). Rather than showing
// nothing, generate real, working search links so the user can actually look
// for a similar problem on each platform. These are honestly labeled
// (isSearch: true) rather than presented as confirmed matches, since we
// never fetch/verify results ourselves - the user's browser performs the
// real search when they click through.
//
// GeeksforGeeks exposes a simple, stable `?s=` site search, so we link there
// directly. Codeforces/CodeChef don't have an equally simple, reliably
// documented full-text search-by-title URL, so we route through a
// site-restricted Google search instead - still a real, working discovery
// mechanism, just not a platform-native one.
function buildSearchAlternatives(title: string): AlternativeProblem[] {
  const query = cleanTitleForSearch(title);
  if (!query) return [];

  const encodedQuery = encodeURIComponent(query);
  const googleSiteSearch = (site: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${query}`)}`;

  return [
    {
      platform: "GeeksforGeeks",
      title: `Search GeeksforGeeks for "${query}"`,
      url: `https://www.geeksforgeeks.org/?s=${encodedQuery}`,
      isSearch: true,
      note: "No curated match - opens a live search"
    },
    {
      platform: "Codeforces",
      title: `Search Codeforces for "${query}"`,
      url: googleSiteSearch("codeforces.com"),
      isSearch: true,
      note: "No curated match - opens a live search"
    },
    {
      platform: "CodeChef",
      title: `Search CodeChef for "${query}"`,
      url: googleSiteSearch("codechef.com"),
      isSearch: true,
      note: "No curated match - opens a live search"
    }
  ];
}

// Single entry point the UI (sidepanel + AI popup) should use: prefer a
// curated, verified match when one exists; otherwise fall back to generated
// search links so the "Similar Questions" section always has something
// useful to show instead of silently rendering nothing.
export function getSimilarQuestions(slug: string, title?: string): AlternativeProblem[] {
  const curated = getAlternativesForProblem(slug, title);
  if (curated?.alternatives?.length) return curated.alternatives;
  if (!title) return [];
  return buildSearchAlternatives(title);
}

export const PREMIUM_PLATFORMS = [
  "GeeksforGeeks",
  "HackerRank",
  "Codeforces",
  "InterviewBit",
  "CodeStudio",
  "Coding Ninjas"
] as const;