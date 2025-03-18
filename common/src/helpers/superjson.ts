import BigNumber from 'bignumber.js'
import SuperJSON from 'superjson'

export const augmentSuperJSON = () => {
  SuperJSON.registerCustom<BigNumber, string>(
    {
      isApplicable: (v) => BigNumber.isBigNumber(v),
      serialize: (v) => v.toString(),
      deserialize: (v) => new BigNumber(v),
    },
    'BigNumber',
  )
}
