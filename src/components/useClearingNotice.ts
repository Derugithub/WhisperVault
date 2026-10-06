import { useCallback, useEffect, useState } from 'react';
import { FAILED_DOWNLOAD_MESSAGE, failedDownloadDismissDelay } from '../speech/downloadNotice';

export function useClearingNotice() {
  const [notice, setNoticeState] = useState<string | null>(null);
  const [failureEpoch, setFailureEpoch] = useState(0);

  const setNotice = useCallback((next: string | null) => {
    setNoticeState(next);
    if (next === FAILED_DOWNLOAD_MESSAGE) {
      setFailureEpoch((epoch) => epoch + 1);
    }
  }, []);

  useEffect(() => {
    const delay = failedDownloadDismissDelay(notice);
    if (delay == null) {
      return;
    }
    const timer = setTimeout(() => {
      setNoticeState((current) => (failedDownloadDismissDelay(current) == null ? current : null));
    }, delay);
    return () => clearTimeout(timer);
  }, [notice, failureEpoch]);

  return [notice, setNotice] as const;
}
