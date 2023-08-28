/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
		  {
			protocol: 'http',
			hostname: 'tonecarrier.local',
			port: '',
		  },
		],
	  },
}

module.exports = nextConfig
