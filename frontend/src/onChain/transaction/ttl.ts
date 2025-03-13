import {type Network, resolveSlotNo} from '@meshsdk/core'
import {addMinutes} from 'date-fns'

const TTL_OFFSET_MINUTES = 30

export const calculateTtl = (now: Date, network: Network) => {
  const txValidityEndTime = addMinutes(now, TTL_OFFSET_MINUTES).getTime()

  return Number.parseInt(resolveSlotNo(network, txValidityEndTime), 10)
}
