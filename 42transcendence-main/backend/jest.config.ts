import type {Config} from 'jest';

const config: Config = {
  verbose: true,
  testEnvironment : "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  testMatch:["**/**/*.jest.test.ts"],
};

export default config;