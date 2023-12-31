module.exports = {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'browserstackce',
          name: 'percy-desktop-app'
        },
        prerelease: true,
        draft: true
      }
    }
  ],
  packagerConfig: {
    asar: true,
    icon: 'src/assets/icon',
    executableName: "percy-desktop-app"
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'BrowserStack Pvt. Ltd.',
        description: 'Desktop Application for Percy.'
      },
    },
    {
      name: '@electron-forge/maker-zip'
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        maintainer: 'BrowserStack Pvt. Ltd.',
        homepage: 'https://browserstack.com/percy'
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
