import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      // System Design is the only track for now, so /learn opens it directly.
      { source: '/learn', destination: '/learn/system-design', permanent: false },
    ];
  },
};

export default withMDX(config);
