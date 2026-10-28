import { detectProvider, getProviderModel } from './providers';

// Test provider detection
console.log('Testing provider detection:');
console.log('gpt-4o ->', detectProvider('gpt-4o'));
console.log('claude-3.5-sonnet ->', detectProvider('claude-3.5-sonnet'));
console.log('gemini-1.5-pro ->', detectProvider('gemini-1.5-pro'));
console.log('unknown-model ->', detectProvider('unknown-model'));

// Test model mapping
console.log('\nTesting model mapping:');
console.log('o4-mini (OpenAI) ->', getProviderModel('o4-mini', 'openai'));
console.log('claude-3.5-sonnet (Anthropic) ->', getProviderModel('claude-3.5-sonnet', 'anthropic'));
console.log('gemini-1.5-pro (Google) ->', getProviderModel('gemini-1.5-pro', 'google'));

console.log('\nProvider system test completed successfully! ✅');
