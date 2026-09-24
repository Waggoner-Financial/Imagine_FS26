import './styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

// One shared query cache. Data stays fresh for a minute, so switching back
// to a portfolio you just viewed renders instantly; a failed request is
// retried once before its card shows the error.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

const root = document.getElementById('root');
if (root === null) throw new Error('index.html is missing the #root element');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
