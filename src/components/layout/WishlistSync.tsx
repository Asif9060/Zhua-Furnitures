'use client';

import { useEffect } from 'react';
import { useWishlistStore } from '@/store';

export default function WishlistSync() {
  const init = useWishlistStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  return null;
}
