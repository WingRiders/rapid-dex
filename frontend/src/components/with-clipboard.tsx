import {type UseClipboardOptions, useClipboard} from '../helpers/clipboard'

export type WithClipboardProps = {
  text: string
  hideIfUnsupported?: boolean
  children?: (clipboard: ReturnType<typeof useClipboard>) => React.ReactNode
} & Pick<UseClipboardOptions, 'isCopiedTime'>

export const WithClipboard = ({
  text,
  hideIfUnsupported = true,
  children,
  ...clipboardOptions
}: WithClipboardProps) => {
  const clipboard = useClipboard(text, clipboardOptions)

  if ((!clipboard.isSupported && hideIfUnsupported) || !children) return null

  return children(clipboard)
}
