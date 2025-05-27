import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// 模拟浏览器环境
global.window = {
    location: {
        href: 'http://localhost:3001'
    }
};

// 模拟 localStorage
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

// 模拟 document
global.document = window.document;

// 模拟 socket.io-client
jest.mock('socket.io-client', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        emit: jest.fn()
    }));
});
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

// 模拟 document
global.document = {
    createElement: jest.fn(),
    getElementById: jest.fn(),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn()
};

// 模拟 socket.io-client
jest.mock('socket.io-client', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        emit: jest.fn()
    }));
});
