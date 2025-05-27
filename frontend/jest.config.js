/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js', 'json', 'mjs'],
    transform: {
        '^.+\\.js$': ['babel-jest', {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-modules-commonjs']
        }]
    },
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    }
};

export default config;
