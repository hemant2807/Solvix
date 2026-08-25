import type { PromptTemplate } from "../types/shared"

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { label: "Explain Problem", iconName: "HelpCircle", message: "Explain this problem" },
  { label: "Give me a Hint", iconName: "Lightbulb", message: "Give me a hint only. Do not solve the problem." },
  { label: "Full Solution", iconName: "FileCode", message: "Generate the complete optimized solution" },
  { label: "Optimize Code", iconName: "Zap", message: "Optimize my current code." },
  { label: "Find Bugs", iconName: "Bug", message: "Find bugs in my current code without giving the complete solution." },
  { label: "Complexity", iconName: "Layers", message: "Explain the time and space complexity of my approach." },
  { label: "Dry Run", iconName: "GitBranch", message: "Dry run the algorithm with a simple example." },
  { label: "Edge Cases", iconName: "AlertTriangle", message: "What are the key edge cases for this problem?" },
  { label: "Test Cases", iconName: "Terminal", message: "Generate a set of test cases to validate my solution." },
  { label: "Brute Force vs Optimal", iconName: "Code2", message: "Compare the brute force approach with the optimized approach." },
  { label: "Common Mistakes", iconName: "AlertTriangle", message: "What are the common mistakes or pitfalls for this problem?" },
  { label: "Related Problems", iconName: "HelpCircle", message: "What are some related problems to practice?" }
]