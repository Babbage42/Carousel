const { createCjsPreset } = require("jest-preset-angular/presets");

module.exports = {
  ...createCjsPreset(),

  testEnvironment: "jsdom",

  roots: ["<rootDir>/projects/carousel-lib/src"],

  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
};
