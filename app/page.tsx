'use client';

import NoSSRWrapper from '@/app/NoSSRWrapper';
import Home from '@/app/Home';

export default function Page() {
  return (
      <NoSSRWrapper><Home /></NoSSRWrapper>
  );
}
