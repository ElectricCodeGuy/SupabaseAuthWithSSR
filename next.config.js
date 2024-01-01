module.exports = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'source.unsplash.com' }]
  },
  async redirects() {
    return [
      {
        permanent: true,
        source: '/auth',
        destination: '/auth/signin'
      }
    ];
  }
};
