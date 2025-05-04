import type {Config} from 'jest';

const config: Config = {
  verbose: true,
  testEnvironment : "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  testTimeout: 35000,
  testMatch:["**/**/*.jest.test.ts"],
};

export default config;