import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  clearMocks: true,
  collectCoverageFrom: [
    "lib/analyst/conversation-status.ts",
    "lib/agent/confidence.ts",
    "lib/agent/history.ts",
    "lib/services/conversations.ts",
    "lib/services/ticket-sla.ts",
    "lib/validations/conversation.ts",
    "!**/*.test.ts",
  ],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironment: "node",
});
