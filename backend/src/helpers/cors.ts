const parseOrigin = (allowedOrigin: string | RegExp) => {
  if (allowedOrigin instanceof RegExp || allowedOrigin.indexOf('*') === -1) {
    return allowedOrigin
  }

  return new RegExp(`^${allowedOrigin.replace('.', '\\.').replace('*', '.*')}$`)
}

export const getCorsOptions = (corsEnabledFor: string, isProd = true) => {
  const allowedOrigins = corsEnabledFor
    ? corsEnabledFor.split(',').map((x) => parseOrigin(x.trim()))
    : []

  return {
    origin: isProd ? allowedOrigins : true,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    credentials: isProd ? !allowedOrigins.includes('*') : true,
  }
}
