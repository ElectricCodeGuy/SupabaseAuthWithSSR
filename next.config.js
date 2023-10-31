module.exports = {
  images: {
    domains: ['source.unsplash.com']
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
