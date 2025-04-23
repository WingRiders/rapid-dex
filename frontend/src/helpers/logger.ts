import {env} from '@/config'

export const debugLog = (...args: any[]) => {
  if (env('NEXT_PUBLIC_ENABLE_DEBUG_LOGS')) {
    console.debug('rapid-dex', ...args)
  }
}

export const wsOnDataDebugLog = (...args: any[]) => {
  debugLog('received event from WebSocket:', ...args)
}
