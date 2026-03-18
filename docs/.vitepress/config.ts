import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Bitcoin Node Hub Docs',
    description: 'Public documentation for operating and understanding Bitcoin Node Hub.',
    cleanUrls: true,
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
    themeConfig: {
        nav: [
            { text: 'Get Started', link: '/guide/overview' },
            { text: 'Security', link: '/guide/security' },
            { text: 'Audit the Code', link: '/guide/quick-facts' },
        ],
        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Overview', link: '/guide/overview' },
                    { text: 'Installation', link: '/guide/installation' },
                    { text: 'Configuration', link: '/guide/configuration' },
                    { text: 'Docker Support', link: '/guide/docker' },
                ],
            },
            {
                text: 'Operate Securely',
                items: [
                    { text: 'Security', link: '/guide/security' },
                    { text: 'Bitcoin Node Setup', link: '/guide/bitcoin-node-setup' },

                    { text: 'Authentication', link: '/guide/authentication' },
                ],
            },
            {
                text: 'Audit the Code',
                items: [
                    { text: 'Quick Facts', link: '/guide/quick-facts' },
                    { text: 'Package References', link: '/guide/package-references' },
                    { text: 'Code Audit', link: '/guide/code-audit' },
                ],
            },
            {
                text: 'Troubleshooting',
                items: [
                    { text: 'Troubleshooting', link: '/guide/troubleshooting' },
                ],
            },
        ],
    },
});
