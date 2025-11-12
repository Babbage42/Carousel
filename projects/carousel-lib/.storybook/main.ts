import type { StorybookConfig } from '@storybook/angular';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-onboarding',
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-essentials',
  ],

  framework: {
    name: '@storybook/angular',
    options: {},
  },

  docs: {},

  webpackFinal: async (cfg) => {
    cfg.resolve = cfg.resolve || {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias || {}),
      // Alias "carousel-lib" vers la build de la lib
      'carousel-lib': path.resolve(process.cwd(), 'dist/carousel-lib'),
    };

    // Assurez-vous que webpack peut résoudre les modules depuis dist
    cfg.resolve.modules = [
      ...(cfg.resolve.modules || []),
      path.resolve(process.cwd(), 'dist'),
    ];

    return cfg;
  },
};

export default config;
