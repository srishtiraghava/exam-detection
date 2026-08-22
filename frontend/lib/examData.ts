import type { CodingQuestionData, McqQuestion } from "@/lib/types";

export const DEMO_CANDIDATE = {
  candidate_id: "demo-001",
  candidate_name: "Alex Morgan",
  exam_id: "se-assessment-001",
  exam_name: "Software Engineering Assessment",
};

export const ASSESSMENT = {
  name: "Software Engineering Assessment",
  durationMinutes: 20,
  durationSeconds: 20 * 60,
  questionCount: 6,
  sections: "MCQ + Coding",
  proctoring: "Enabled",
};

export const MCQ_QUESTIONS: McqQuestion[] = [
  {
    id: "q1",
    type: "mcq",
    topic: "Data Structures",
    difficulty: "Easy",
    question: "What is the time complexity of binary search on a sorted array of n elements?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correctAnswer: 1,
    explanation: "Binary search halves the search space each step, so it runs in O(log n).",
  },
  {
    id: "q2",
    type: "mcq",
    topic: "DBMS",
    difficulty: "Easy",
    question: "Which constraint uniquely identifies each row in a relational table?",
    options: ["Foreign key", "Check constraint", "Primary key", "Default constraint"],
    correctAnswer: 2,
    explanation: "A primary key uniquely identifies each tuple and cannot contain NULL values.",
  },
  {
    id: "q3",
    type: "mcq",
    topic: "Operating Systems",
    difficulty: "Medium",
    question: "Which of the following is NOT a necessary condition for deadlock?",
    options: ["Mutual exclusion", "Hold and wait", "Preemption", "Circular wait"],
    correctAnswer: 2,
    explanation: "Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait. Preemption would prevent deadlock.",
  },
  {
    id: "q4",
    type: "mcq",
    topic: "Computer Networks",
    difficulty: "Medium",
    question: "Which protocol provides reliable, connection-oriented delivery?",
    options: ["UDP", "IP", "ICMP", "TCP"],
    correctAnswer: 3,
    explanation: "TCP establishes a connection and guarantees ordered, reliable delivery.",
  },
  {
    id: "q5",
    type: "mcq",
    topic: "Programming",
    difficulty: "Hard",
    question:
      "In a hash table that uses chaining, what is the expected time complexity of a successful search when the load factor is α and the hash function is uniform?",
    options: ["O(1)", "O(α)", "O(n)", "O(log n)"],
    correctAnswer: 1,
    explanation: "With uniform hashing and chaining, a successful search is Θ(1 + α), commonly written as O(α).",
  },
];

export const CODING_QUESTION: CodingQuestionData = {
  id: "q6",
  type: "coding",
  title: "Two Sum",
  topic: "Data Structures",
  difficulty: "Medium",
  question:
    "Given an integer array nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
    { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
  ],
  constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
  starterCode: {
    javascript: `function twoSum(nums, target) {
  // Write your solution here
}
`,
    python: `def two_sum(nums, target):
    # Write your solution here
    pass
`,
  },
};

export const QUESTIONS = [...MCQ_QUESTIONS, CODING_QUESTION];

export const MCQ_ANSWER_KEY: Record<string, number> = Object.fromEntries(
  MCQ_QUESTIONS.map((question) => [question.id, question.correctAnswer]),
);
