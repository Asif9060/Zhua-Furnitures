'use client';

import { useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store';

export default function CartSync() {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);
  const hydrateForGuest = useCartStore((state) => state.hydrateForGuest);
  const hydrateForUser = useCartStore((state) => state.hydrateForUser);

  useEffect(() => {
    if (!supabase) {
      hydrateForGuest();
      return;
    }

    let active = true;

    const bootstrap = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (user) {
          await hydrateForUser(user.id);
          return;
        }

        hydrateForGuest();
      } catch {
        if (active) {
          hydrateForGuest();
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id;
      if (userId) {
        await hydrateForUser(userId);
        return;
      }

      hydrateForGuest();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrateForGuest, hydrateForUser, supabase]);

  return null;
}
