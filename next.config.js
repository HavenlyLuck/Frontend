/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    // box2d-wasm(Emscripten 빌드)이 Node 환경 분기에서 fs/path 등을 require하는데,
    // 실제로는 브라우저에서만 쓰이므로 클라이언트 번들에서는 무시하도록 설정한다.
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false }
    }
    return config
  },
}
module.exports = nextConfig
