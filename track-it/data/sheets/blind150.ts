import type { PracticeSheet } from './types';
import { blind75Sheet } from './blind75';

export const blind150Sheet: PracticeSheet = {
  id: 'blind-150',
  name: 'Blind 150 Extended Problem Set',
  shortName: 'Blind 150',
  description: 'An extended expansion of the original Blind 75 list covering additional advanced topics and edge cases.',
  category: 'curated',
  author: 'LeetCode Community',
  totalQuestions: 150,
  questions: [
    ...blind75Sheet.questions,
    { id: 'b150-76', name: 'Subarray Sum Equals K', leetcodeUrl: 'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty: 'Medium', topics: ['Array', 'Hash Table', 'Prefix Sum'] },
    { id: 'b150-77', name: 'Sort Colors', leetcodeUrl: 'https://leetcode.com/problems/sort-colors/', difficulty: 'Medium', topics: ['Array', 'Two Pointers', 'Sorting'] },
    { id: 'b150-78', name: 'Letter Combinations of a Phone Number', leetcodeUrl: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', difficulty: 'Medium', topics: ['String', 'Backtracking'] },
    { id: 'b150-79', name: 'Permutations', leetcodeUrl: 'https://leetcode.com/problems/permutations/', difficulty: 'Medium', topics: ['Array', 'Backtracking'] },
    { id: 'b150-80', name: 'Subsets', leetcodeUrl: 'https://leetcode.com/problems/subsets/', difficulty: 'Medium', topics: ['Array', 'Backtracking', 'Bit Manipulation'] },
    { id: 'b150-81', name: 'Word Search', leetcodeUrl: 'https://leetcode.com/problems/word-search/', difficulty: 'Medium', topics: ['Array', 'Backtracking', 'Matrix'] },
    { id: 'b150-82', name: 'Palindrome Partitioning', leetcodeUrl: 'https://leetcode.com/problems/palindrome-partitioning/', difficulty: 'Medium', topics: ['String', 'Dynamic Programming', 'Backtracking'] },
    { id: 'b150-83', name: 'Kth Largest Element in an Array', leetcodeUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'Medium', topics: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'] },
    { id: 'b150-84', name: 'Task Scheduler', leetcodeUrl: 'https://leetcode.com/problems/task-scheduler/', difficulty: 'Medium', topics: ['Array', 'Hash Table', 'Greedy', 'Sorting', 'Heap (Priority Queue)'] },
    { id: 'b150-85', name: 'Design Twitter', leetcodeUrl: 'https://leetcode.com/problems/design-twitter/', difficulty: 'Medium', topics: ['Hash Table', 'Linked List', 'Design', 'Heap (Priority Queue)'] }
  ]
};
