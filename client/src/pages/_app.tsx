import '@/styles/globals.css';

import { ReduxAIProvider } from '@redux-ai/react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

import { store } from '@/store';
import { actionSchema } from '@/store/schema';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <ReduxAIProvider store={store} endpoint="/api/chat" actions={actionSchema}>
        <Component {...pageProps} />
      </ReduxAIProvider>
    </Provider>
  );
}
