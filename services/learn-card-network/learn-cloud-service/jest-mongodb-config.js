module.exports = {
    mongodbMemoryServerOptions: {
      binary: {
        version: '5.1.0',
        skipMD5: true,
      },
      instance: {
        dbName: 'main',
      },
      autoStart: false,
    },
  };