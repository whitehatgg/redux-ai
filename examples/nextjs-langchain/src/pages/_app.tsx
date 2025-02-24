import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { ReduxAIProvider } from '@redux-ai/react';
import { wrapper } from '@/store';
import { storeSchema } from '@/store/schema';

function App({ Component, pageProps }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(pageProps);

  return (
    <Provider store={store}>
      <ReduxAIProvider
        store={store}
        apiEndpoint="/api/chat"
        schema={storeSchema}
        actions={[
          {
            type: 'form/submit',
            description: 'Submit form data',
            keywords: ['form', 'submit', 'save'],
            metadata: {
              category: 'Form',
              importance: 'high'
            }
          }
        ]}
      >
        <Component {...props} />
      </ReduxAIProvider>
    </Provider>
  );
}

export default App;