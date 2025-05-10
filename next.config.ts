import type { NextConfig } from 'next';

// 添加调试信息
console.log('构建模式:', process.env.NODE_ENV);
const isProd = process.env.NODE_ENV === 'production';
console.log('是否生产环境:', isProd);

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // 对于静态导出必须设置为true
    formats: ['image/webp', 'image/avif'],
  },
  // 确保GitHub Pages路径正确 - 更新为新仓库名称
  basePath: isProd ? '/test' : '',
  assetPrefix: isProd ? '/test/' : '',
  trailingSlash: true,
  // 添加环境变量
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? '/test' : '',
    NEXT_PUBLIC_IS_GITHUB_PAGES: isProd ? 'true' : 'false',
  },
};

console.log('Next.js 配置:', {
  basePath: nextConfig.basePath,
  assetPrefix: nextConfig.assetPrefix,
  环境变量: nextConfig.env,
});

export default nextConfig;
