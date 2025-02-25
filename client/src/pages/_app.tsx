import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { ReduxAIProvider } from '@redux-ai/react';
import { store } from '@/store';
import { storeSchema } from '@/store/schema';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <ReduxAIProvider
        store={store}
        apiEndpoint="/api/chat"
        schema={storeSchema}
      >
        <Component {...pageProps} />
      </ReduxAIProvider>
    </Provider>
  );
}