import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Bitcoin Node Hub Docs',
    description: 'Public documentation for operating and understanding Bitcoin Node Hub.',
    cleanUrls: true,
    themeConfig: {
        nav: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Security', link: '/guide/security' },
            { text: 'Docker', link: '/guide/docker' },
            { text: 'Docs Deploy', link: '/guide/deployment-amplify' },
        ],
        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Overview', link: '/guide/overview' },
                    { text: 'Features', link: '/guide/features' },
                ],
            },
            {
                text: 'Operate Securely',
                items: [
                    { text: 'Security', link: '/guide/security' },
                    { text: 'Bitcoin Node Setup', link: '/guide/bitcoin-node-setup' },
                    { text: 'Configuration', link: '/guide/configuration' },
                    { text: 'Authentication', link: '/guide/authentication' },
                ],
            },
            {
                text: 'Docker Workflows',
                items: [
                    { text: 'Docker Support', link: '/guide/docker' },
                    { text: 'Local Docker Workflow', link: '/guide/local-docker-workflow' },
                ],
            },
            {
                text: 'Troubleshooting',
                items: [
                    { text: 'Troubleshooting', link: '/guide/troubleshooting' },
                ],
            },
            {
                text: 'Docs Site',
                items: [
                    { text: 'Amplify Docs Deploy', link: '/guide/deployment-amplify' },
                ],
            },
        ],
    },
});
