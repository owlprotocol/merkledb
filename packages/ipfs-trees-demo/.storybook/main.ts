module.exports = {
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    addons: [
        //"@storybook/addon-links/register",
        "@storybook/addon-essentials",
        //"@storybook/addon-interactions/register"
    ],
    framework: "@storybook/react",
    core: {
        builder: "storybook-builder-vite"
    },
    features: {
        storyStoreV7: true,
    },
    async viteFinal(config, { configType }) {
        // customize the Vite config here
        /** Default optimizeDeps
            '@mdx-js/react',
            '@storybook/client-api',
            '@storybook/client-logger',
            '@storybook/react',
            'prettier/parser-babel',
            'prettier/parser-flow',
            'prettier/parser-typescript',
            'prop-types',
            'react-dom',
            'react'
         */
        //config.optimizeDeps.include.push('fast-deep-equal')

        /**
         *  "@storybook/addon-actions": "^6.4.19",
    "@storybook/addon-essentials": "^6.4.19",
    "@storybook/addon-interactions": "^6.4.19",
    "@storybook/addon-links": "^6.4.19",
         */

        // return the customized config
        return config;
    },
}
