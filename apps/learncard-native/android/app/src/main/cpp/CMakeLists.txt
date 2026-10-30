cmake_minimum_required(VERSION 3.22.1)
project(learncardquickjs C)

set(QUICKJS ${CMAKE_CURRENT_SOURCE_DIR}/../../../../third_party/quickjs)

add_library(learncardquickjs SHARED
    jni.c
    ${QUICKJS}/cutils.c
    ${QUICKJS}/libregexp.c
    ${QUICKJS}/libunicode.c
    ${QUICKJS}/quickjs.c
    ${QUICKJS}/xsum.c
)

target_include_directories(learncardquickjs PRIVATE ${QUICKJS})
target_compile_definitions(learncardquickjs PRIVATE _GNU_SOURCE)
target_compile_options(learncardquickjs PRIVATE -O2 -Wno-unused-parameter -Wno-unused-function)
target_link_libraries(learncardquickjs m)
if(ANDROID)
    target_link_options(learncardquickjs PRIVATE -Wl,-z,max-page-size=16384)
endif()
