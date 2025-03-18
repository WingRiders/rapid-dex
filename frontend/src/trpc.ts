'use client'

import {createTRPCContext} from '@trpc/tanstack-react-query'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/appRouter'
import BigNumber from 'bignumber.js'
import SuperJSON from 'superjson'

// Register BigNumber serialization with SuperJSON
SuperJSON.registerCustom<BigNumber, string>(
  {
    isApplicable: (v) => BigNumber.isBigNumber(v),
    serialize: (v) => v.toString(),
    deserialize: (v) => new BigNumber(v),
  },
  'BigNumber',
)

export const {TRPCProvider, useTRPC} = createTRPCContext<ServerAppRouter>()

export type TRPC = ReturnType<typeof useTRPC>
