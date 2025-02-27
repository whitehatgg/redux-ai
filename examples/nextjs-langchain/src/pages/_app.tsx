import '@/styles/globals.css';

import { ReduxAIProvider } from '@redux-ai/react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

import { wrapper } from '@/store';
import { actionSchema } from '@/store/schema';

function App({ Component, pageProps }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <Provider store={store}>
      <ReduxAIProvider store={store} actions={actionSchema} endpoint="/api/query">
        <Component {...props} />
      </ReduxAIProvider>
    </Provider>
  );
}

export default App;
