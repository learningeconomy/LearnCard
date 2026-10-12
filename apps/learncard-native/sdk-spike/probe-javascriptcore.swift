import Foundation
import JavaScriptCore
let context = JSContext()!
let tiny = "new Uint8Array([0,97,115,109,1,0,0,0,1,7,1,96,2,127,127,1,127,3,2,1,0,7,7,1,3,97,100,100,0,0,10,9,1,7,0,32,0,32,1,106,11])"
let value = context.evaluateScript("""
JSON.stringify((() => { try {
 const module = new WebAssembly.Module(\(tiny));
 return { available: true, add: new WebAssembly.Instance(module).exports.add(20,22) };
} catch (error) { return { available: false, error: String(error) }; } })())
""")!
print(value.toString()!)
