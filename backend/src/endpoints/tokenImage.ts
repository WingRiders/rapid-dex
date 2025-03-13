import {getTokenLogo} from '@/tokenRegistry'

// Handle the /token-image/[subject] route
export const handleTokenImageRequest = (subject: string): Response => {
  const logoBase64 = getTokenLogo(subject)

  if (logoBase64 == null) {
    return new Response('Token image not found', {status: 404})
  }

  const buffer = Buffer.from(logoBase64, 'base64')
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
