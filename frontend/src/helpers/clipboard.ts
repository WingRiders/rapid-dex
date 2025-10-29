import {useCallback, useEffect, useRef, useState} from 'react'

const DEFAULT_IS_COPIED_TIME = 2000

export type UseClipboardOptions = {
  // how long after the user copies the text should the flag isCopied stay true
  // when set to 0, it stays true indefinitely
  isCopiedTime?: number
}

export const useClipboard = (
  text: string,
  {isCopiedTime = DEFAULT_IS_COPIED_TIME}: UseClipboardOptions = {},
) => {
  const [isCopied, setIsCopiedState] = useState(false)
  const isCopiedTimeoutId = useRef<Timer | null>(null)

  const setIsCopied = useCallback(
    (value: boolean) => {
      setIsCopiedState(value)
      if (value) {
        if (isCopiedTimeoutId.current) clearTimeout(isCopiedTimeoutId.current)
        if (isCopiedTime)
          isCopiedTimeoutId.current = setTimeout(
            () => setIsCopied(false),
            isCopiedTime,
          )
      } else {
        if (isCopiedTimeoutId.current) clearTimeout(isCopiedTimeoutId.current)
      }
    },
    [isCopiedTime],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: We need text in the dependencies
  useEffect(() => {
    return () => setIsCopied(false)
  }, [setIsCopied, text])

  const isSupported = !!window.navigator?.clipboard

  const copy = useCallback(async () => {
    if (!isSupported) {
      console.error('Clipboard not supported!')
      return
    }
    try {
      await window.navigator.clipboard.writeText(text)
      setIsCopied(true)
    } catch (err) {
      console.error(err)
    }
  }, [isSupported, text, setIsCopied])

  return {
    isCopied,
    isSupported,
    copy,
    resetState: useCallback(() => setIsCopied(false), [setIsCopied]),
  }
}
