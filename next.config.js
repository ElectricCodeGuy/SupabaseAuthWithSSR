module.exports = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'source.unsplash.com' }]
  },
  async rewrites() {
    return [
      {
        source: '/auth',
        destination: '/auth/signin'
      },
      {
        source: '/aichat',
        destination: '/aichat/1'
      }
    ];
  }
};
