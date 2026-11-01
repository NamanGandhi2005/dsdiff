export const PATTERNS = [
  {
    id: 'arrays',
    name: 'Arrays & Hashing',
    summary: 'Store values so you can answer “have I seen this?” in constant time instead of scanning the array again.',
    whenToUse: 'The problem asks for duplicates, pairs that sum to a target, frequency counts, or grouping items.',
    complexity: 'One pass is usually O(n) time and O(n) extra space for the map.',
    prompts: ['Two Sum', 'Group Anagrams', 'Top K Frequent Elements'],
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    summary: 'Walk inward from both ends, or use a slow and fast pointer, when the data is sorted or you need a pair.',
    whenToUse: 'Sorted arrays, palindromes, or removing items in place without extra space.',
    complexity: 'O(n) time and O(1) extra space when the array is already sorted.',
    prompts: ['Valid Palindrome', '3Sum', 'Container With Most Water'],
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    summary: 'Keep a window of the current range and move its edges so you never restart from scratch.',
    whenToUse: 'Longest or shortest subarray or substring that satisfies a condition.',
    complexity: 'O(n) time. Each index enters and leaves the window once.',
    prompts: ['Longest Substring Without Repeating Characters', 'Minimum Size Subarray Sum'],
  },
  {
    id: 'stack',
    name: 'Stack',
    summary: 'The last unmatched item is the one you need next. A stack remembers that order for you.',
    whenToUse: 'Nested brackets, next greater element, or evaluating an expression left to right.',
    complexity: 'O(n) time and O(n) space.',
    prompts: ['Valid Parentheses', 'Daily Temperatures', 'Min Stack'],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    summary: 'Cut the search space in half when you can tell which side the answer lives on.',
    whenToUse: 'Sorted data, or a monotonic check such as “is this speed enough?”.',
    complexity: 'O(log n) time for a direct search.',
    prompts: ['Binary Search', 'Search in Rotated Sorted Array', 'Koko Eating Bananas'],
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    summary: 'Nodes point to the next one. Draw the pointers before you change them.',
    whenToUse: 'Reversal, a cycle, merging two lists, or removing the nth node from the end.',
    complexity: 'Usually O(n) time and O(1) extra space with a few pointers.',
    prompts: ['Reverse Linked List', 'Linked List Cycle', 'Merge Two Sorted Lists'],
  },
  {
    id: 'trees',
    name: 'Trees',
    summary: 'Recurse on the left and right child, and decide what each call should return to its parent.',
    whenToUse: 'Depth, path sums, lowest common ancestor, or level-by-level traversal.',
    complexity: 'O(n) time to visit every node. Recursion uses O(h) stack space.',
    prompts: ['Maximum Depth of Binary Tree', 'Lowest Common Ancestor', 'Level Order Traversal'],
  },
  {
    id: 'graphs',
    name: 'Graphs',
    summary: 'Model the input as nodes and edges, then search with BFS for shortest steps or DFS for reachability.',
    whenToUse: 'Grids, courses with prerequisites, islands, or “can I get from A to B?”.',
    complexity: 'O(V + E) for a standard traversal.',
    prompts: ['Number of Islands', 'Course Schedule', 'Clone Graph'],
  },
  {
    id: 'heap',
    name: 'Heap / Priority Queue',
    summary: 'Keep only the best k items so far, instead of sorting the whole input.',
    whenToUse: 'Top K, running median, or always expanding the current cheapest option.',
    complexity: 'O(n log k) when the heap stays size k.',
    prompts: ['Kth Largest Element', 'Merge K Sorted Lists', 'Task Scheduler'],
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    summary: 'Try a choice, recurse, then undo it. The undo step is what makes the search correct.',
    whenToUse: 'Subsets, permutations, combinations, or filling a board under constraints.',
    complexity: 'Exponential in the number of choices. Prune as soon as a path is invalid.',
    prompts: ['Subsets', 'Permutations', 'Combination Sum'],
  },
  {
    id: 'dp-1d',
    name: 'Dynamic Programming (1D)',
    summary: 'Save the answer for a smaller size so you never recompute it.',
    whenToUse: 'Climbing stairs style problems, house robber, or a decision at each index.',
    complexity: 'O(n) time and O(n) or O(1) space after you see the recurrence.',
    prompts: ['Climbing Stairs', 'House Robber', 'Coin Change'],
  },
  {
    id: 'greedy',
    name: 'Greedy',
    summary: 'Take the best local choice only when you can explain why it never blocks a better global answer.',
    whenToUse: 'Intervals, jump games, or scheduling where sorting reveals the order.',
    complexity: 'Often O(n log n) because of the sort, then one pass.',
    prompts: ['Jump Game', 'Merge Intervals', 'Non-overlapping Intervals'],
  },
];

export function notesForPattern(notes, pattern) {
  if (!notes || !pattern) return [];
  const keys = [pattern.id, pattern.name].map((value) => value.toLowerCase());
  return notes.filter((note) =>
    (note.tags || []).some((tag) => {
      const lower = tag.toLowerCase();
      return keys.some((key) => lower === key || lower.includes(key) || key.includes(lower));
    })
  );
}
