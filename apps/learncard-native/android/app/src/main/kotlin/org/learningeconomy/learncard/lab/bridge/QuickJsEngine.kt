package org.learningeconomy.learncard.lab.bridge

class QuickJsEngine : AutoCloseable {
    private var handle: Long = nativeCreate()
    private var handler: (String) -> String = { """{"error":"Request refused"}""" }

    init {
        check(handle != 0L) { "QuickJS failed to start" }
    }

    fun setHandler(handler: (String) -> String) {
        this.handler = handler
    }

    @Suppress("unused")
    fun dispatch(message: String): String = handler(message)

    fun evaluate(source: String, filename: String = "account.js"): String? {
        check(handle != 0L) { "QuickJS is closed" }
        return nativeEvaluate(handle, source.toByteArray(Charsets.UTF_8), filename)
    }

    override fun close() {
        if (handle == 0L) return
        val pointer = handle
        handle = 0
        nativeClose(pointer)
    }

    private external fun nativeCreate(): Long
    private external fun nativeEvaluate(pointer: Long, source: ByteArray, filename: String): String?
    private external fun nativeClose(pointer: Long)

    companion object {
        init {
            val explicit = System.getProperty("learncard.quickjs.lib")
            if (!explicit.isNullOrBlank()) System.load(explicit) else System.loadLibrary("learncardquickjs")
        }
    }
}
