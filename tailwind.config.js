// tailwind.config.js
export const content = [
    // your content paths
];
export const safelist = [
    // Safelist all possible text and background color patterns
    {
        pattern: /^(text|bg)-\[#[a-fA-F0-9]{6}\]$/,
    },
    // Or be more specific if you know the format
    {
        pattern: /^text-\[#[a-fA-F0-9]{6}\]$/,
    },
    {
        pattern: /^bg-\[#[a-fA-F0-9]{6}\]$/,
    }
];
export const theme = {
    extend: {},
};
export const plugins = [];