'use client'

import {createTRPCContext} from '@trpc/tanstack-react-query'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/app-router'

export const {TRPCProvider, useTRPC} = createTRPCContext<ServerAppRouter>()

export type TRPC = ReturnType<typeof useTRPC>
