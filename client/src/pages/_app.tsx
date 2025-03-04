import '@/styles/globals.css';

import { ReduxAIProvider } from '@redux-ai/react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

import { store } from '@/store';
import { jsonActionSchema } from '@/store/schema';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <ReduxAIProvider store={store} endpoint="/api/chat" actions={jsonActionSchema}>
        <Component {...pageProps} />
      </ReduxAIProvider>
    </Provider>
  );
}
