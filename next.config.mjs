/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // /inspection was renamed to /renting-mould-assessment. Keep the old URL
      // working (paid ad links, shared links, search index) with a permanent
      // (308) redirect so nothing 404s.
      {
        source: "/inspection",
        destination: "/renting-mould-assessment",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
