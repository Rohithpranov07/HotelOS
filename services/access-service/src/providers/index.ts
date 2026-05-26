import { config } from '../config.js';
import { MockKeyProvider } from './mock.provider.js';
import { AssaAbloyProvider } from './assa-abloy.provider.js';
import type { IKeyProvider } from './key-provider.interface.js';

let providerSingleton: IKeyProvider | null = null;

export function getKeyProvider(): IKeyProvider {
  if (providerSingleton) return providerSingleton;
  switch (config.keyProvider) {
    case 'assa_abloy':
      if (!config.assaAbloy.apiKey) {
        throw new Error('ASSA_ABLOY_API_KEY required when KEY_PROVIDER=assa_abloy');
      }
      providerSingleton = new AssaAbloyProvider(config.assaAbloy.baseUrl, config.assaAbloy.apiKey);
      break;
    case 'salto':
      // Salto adapter is not implemented; fall back to mock with a warning.
      providerSingleton = new MockKeyProvider();
      break;
    case 'mock':
    default:
      providerSingleton = new MockKeyProvider();
  }
  return providerSingleton;
}

/** Test hook — replace the active provider. */
export function setKeyProviderForTests(provider: IKeyProvider | null): void {
  providerSingleton = provider;
}

export * from './key-provider.interface.js';
export { MockKeyProvider } from './mock.provider.js';
export { AssaAbloyProvider } from './assa-abloy.provider.js';
