import { getDidKitPlugin } from './dist/plugin.js';

console.log('Testing native DIDKit plugin...\n');

try {
    const plugin = await getDidKitPlugin();
    console.log('✓ Plugin loaded successfully');
    console.log('  Name:', plugin.name);
    console.log('  Display:', plugin.displayName);
    
    // Test generateEd25519KeyFromBytes
    const seed = new Uint8Array(32).fill(1);
    const jwk = plugin.methods.generateEd25519KeyFromBytes(null, seed);
    console.log('\n✓ generateEd25519KeyFromBytes works');
    console.log('  Key type:', jwk.kty);
    console.log('  Curve:', jwk.crv);
    
    // Test keyToDID
    const did = plugin.methods.keyToDid(null, 'key', jwk);
    console.log('\n✓ keyToDID works');
    console.log('  DID:', did);
    
    console.log('\n🎉 All minimal methods working!');
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
