 module.exports = {
  "stories": [
    "../src/**/**/*.stories.mdx",
    "../src/**/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
     "@storybook/addon-essentials",
      {
        name: '@storybook/addon-postcss',
        options: {
            postcssLoaderOptions: {
                // When using postCSS 8
                implementation: require('postcss'),
            },
        },
    },
  ],
     core: {
         builder: 'webpack5'
     }
}
