const nextConfig = {
  reactStrictMode: true,
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({ CESIUM_BASE_URL: JSON.stringify('/cesium/') }),
    );
    return config;
  },
};
export default nextConfig;
