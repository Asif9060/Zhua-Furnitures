export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export function appendToastToPath(path: string, kind: ToastKind, message: string): string {
  const [pathAndQuery, hash = ''] = path.split('#', 2);
  const [rawPathname, rawQuery = ''] = pathAndQuery.split('?', 2);
  const pathname = rawPathname || '/';

  const params = new URLSearchParams(rawQuery);
  params.set('toastType', kind);
  params.set('toast', message);

  const nextQuery = params.toString();
  const queryPart = nextQuery ? `?${nextQuery}` : '';
  const hashPart = hash ? `#${hash}` : '';

  return `${pathname}${queryPart}${hashPart}`;
}
