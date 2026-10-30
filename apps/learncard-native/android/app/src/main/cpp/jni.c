#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include "quickjs.h"

typedef struct {
    JavaVM *vm;
    JSRuntime *runtime;
    JSContext *context;
    jobject engine;
    jmethodID dispatch;
    char **sources;
    int sourceCount;
    int sourceCapacity;
} QuickJsHost;

static JNIEnv *attach(QuickJsHost *host) {
#if defined(__ANDROID__)
    JNIEnv *env = NULL;
    if ((*host->vm)->GetEnv(host->vm, &env, JNI_VERSION_1_6) == JNI_EDETACHED) {
        (*host->vm)->AttachCurrentThread(host->vm, &env, NULL);
    }
    return env;
#else
    /* The host JDK declares these as void**; the NDK declares JNIEnv**. */
    void *venv = NULL;
    if ((*host->vm)->GetEnv(host->vm, &venv, JNI_VERSION_1_6) == JNI_EDETACHED) {
        (*host->vm)->AttachCurrentThread(host->vm, &venv, NULL);
    }
    return (JNIEnv *)venv;
#endif
}

static JSValue js_native(JSContext *context, JSValueConst this_value, int argc, JSValueConst *argv) {
    (void)this_value;
    QuickJsHost *host = JS_GetContextOpaque(context);
    if (!host || argc < 1) return JS_ThrowTypeError(context, "Request refused");
    const char *message = JS_ToCString(context, argv[0]);
    if (!message) return JS_EXCEPTION;
    JNIEnv *env = attach(host);
    jstring input = (*env)->NewStringUTF(env, message);
    JS_FreeCString(context, message);
    jstring output = (*env)->CallObjectMethod(env, host->engine, host->dispatch, input);
    if ((*env)->ExceptionCheck(env)) {
        (*env)->ExceptionClear(env);
        return JS_ThrowInternalError(context, "Request refused");
    }
    if (!output) return JS_NULL;
    const char *text = (*env)->GetStringUTFChars(env, output, NULL);
    JSValue result = text ? JS_NewString(context, text) : JS_NULL;
    if (text) (*env)->ReleaseStringUTFChars(env, output, text);
    return result;
}

static void throw_exception(JNIEnv *env, JSContext *context) {
    JSValue thrown = JS_GetException(context);
    const char *text = JS_ToCString(context, thrown);
    jclass type = (*env)->FindClass(env, "org/learningeconomy/learncard/lab/bridge/QuickJsException");
    (*env)->ThrowNew(env, type, text ? text : "JavaScript error");
    if (text) JS_FreeCString(context, text);
    JS_FreeValue(context, thrown);
}

static int drain(JSRuntime *runtime, JSContext *context) {
    JSContext *pending = NULL;
    for (int guard = 0; guard < 100000; guard++) {
        int status = JS_ExecutePendingJob(runtime, &pending);
        if (status < 0) return -1;
        if (status == 0) return 0;
    }
    JS_ThrowInternalError(context, "JavaScript job queue did not settle");
    return -1;
}

JNIEXPORT jlong JNICALL
Java_org_learningeconomy_learncard_lab_bridge_QuickJsEngine_nativeCreate(JNIEnv *env, jobject thiz) {
    QuickJsHost *host = calloc(1, sizeof(QuickJsHost));
    if (!host) return 0;
    (*env)->GetJavaVM(env, &host->vm);
    host->engine = (*env)->NewGlobalRef(env, thiz);
    jclass type = (*env)->GetObjectClass(env, thiz);
    host->dispatch = (*env)->GetMethodID(env, type, "dispatch", "(Ljava/lang/String;)Ljava/lang/String;");
    host->runtime = JS_NewRuntime();
    if (!host->runtime) return 0;
    JS_SetMemoryLimit(host->runtime, (size_t)512 * 1024 * 1024);
    JS_SetMaxStackSize(host->runtime, 8 * 1024 * 1024);
    host->context = JS_NewContext(host->runtime);
    JS_SetContextOpaque(host->context, host);
    JSValue global = JS_GetGlobalObject(host->context);
    JS_SetPropertyStr(host->context, global, "__lcNative", JS_NewCFunction(host->context, js_native, "__lcNative", 1));
    JS_FreeValue(host->context, global);
    return (jlong)(intptr_t)host;
}

JNIEXPORT jstring JNICALL
Java_org_learningeconomy_learncard_lab_bridge_QuickJsEngine_nativeEvaluate(
        JNIEnv *env, jobject thiz, jlong pointer, jbyteArray source, jstring filename) {
    (void)thiz;
    QuickJsHost *host = (QuickJsHost *)(intptr_t)pointer;
    jsize length = (*env)->GetArrayLength(env, source);
    jbyte *bytes = (*env)->GetByteArrayElements(env, source, NULL);
    const char *file = (*env)->GetStringUTFChars(env, filename, NULL);
    char *copy = malloc((size_t)length + 1);
    memcpy(copy, bytes, (size_t)length);
    copy[length] = 0;
    if (host->sourceCount == host->sourceCapacity) {
        host->sourceCapacity = host->sourceCapacity == 0 ? 8 : host->sourceCapacity * 2;
        host->sources = realloc(host->sources, (size_t)host->sourceCapacity * sizeof(char *));
    }
    host->sources[host->sourceCount++] = copy;
    JSValue result = JS_Eval(host->context, copy, (size_t)length, file, JS_EVAL_TYPE_GLOBAL);
    int failed = JS_IsException(result);
    (*env)->ReleaseByteArrayElements(env, source, bytes, JNI_ABORT);
    (*env)->ReleaseStringUTFChars(env, filename, file);
    if (failed || drain(host->runtime, host->context) < 0) {
        fprintf(stderr, "quickjs eval failed len=%d\n", (int)length);
        JS_FreeValue(host->context, result);
        throw_exception(env, host->context);
        return NULL;
    }
    if (JS_IsUndefined(result) || JS_IsNull(result)) {
        JS_FreeValue(host->context, result);
        return NULL;
    }
    const char *text = JS_ToCString(host->context, result);
    jstring output = text ? (*env)->NewStringUTF(env, text) : NULL;
    if (text) JS_FreeCString(host->context, text);
    JS_FreeValue(host->context, result);
    return output;
}

JNIEXPORT void JNICALL
Java_org_learningeconomy_learncard_lab_bridge_QuickJsEngine_nativeClose(JNIEnv *env, jobject thiz, jlong pointer) {
    (void)thiz;
    QuickJsHost *host = (QuickJsHost *)(intptr_t)pointer;
    if (!host) return;
    for (int index = 0; index < host->sourceCount; index++) free(host->sources[index]);
    free(host->sources);
    JS_FreeContext(host->context);
    JS_FreeRuntime(host->runtime);
    (*env)->DeleteGlobalRef(env, host->engine);
    free(host);
}
