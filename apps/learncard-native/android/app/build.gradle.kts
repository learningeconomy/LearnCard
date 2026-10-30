import org.gradle.api.tasks.testing.Test

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val repoRoot = rootProject.projectDir.resolve("../../..")

android {
    namespace = "org.learningeconomy.learncard.lab"
    compileSdk = 35
    ndkVersion = "27.2.12479018"

    defaultConfig {
        applicationId = "org.learningeconomy.learncard.native.experiment"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        ndk {
            abiFilters += listOf("arm64-v8a", "x86_64")
        }
        externalNativeBuild {
            cmake {
                arguments += "-DANDROID_STL=c++_shared"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
        unitTests.isReturnDefaultValues = true
    }

    lint {
        abortOnError = true
        disable += setOf("MissingTranslation", "IconMissingDensityFolder", "MonochromeLauncherIcon")
    }

    sourceSets.named("main") {
        assets.srcDir(layout.buildDirectory.dir("generated/native-assets"))
    }
}

val copyNativeAssets = tasks.register<Copy>("copyNativeAssets") {
    into(layout.buildDirectory.dir("generated/native-assets"))
    from(repoRoot.resolve("apps/learncard-native/localization/Localizable.xcstrings"))
    from(rootProject.file("host/prelude.js"))
    from(repoRoot.resolve("apps/learncard-native/ios/Sources/Assets.xcassets/LearnCardMark.imageset/mark.png")) {
        rename { "LearnCardMark.png" }
    }
    from(repoRoot.resolve("apps/learncard-native/ios/Sources/Assets.xcassets")) {
        include(
            "HomeTab.imageset/HomeTab@2x.png",
            "HomeTab.imageset/HomeTab-dark@2x.png",
            "HomeTabActive.imageset/HomeTabActive@2x.png",
            "HomeTabActive.imageset/HomeTabActive-dark@2x.png",
            "CollectionTab.imageset/CollectionTab@2x.png",
            "CollectionTab.imageset/CollectionTab-dark@2x.png",
            "CollectionTabActive.imageset/CollectionTabActive@2x.png",
            "CollectionTabActive.imageset/CollectionTabActive-dark@2x.png",
            "InboxTab.imageset/InboxTab@2x.png",
            "InboxTab.imageset/InboxTab-dark@2x.png",
            "InboxTabActive.imageset/InboxTabActive@2x.png",
            "InboxTabActive.imageset/InboxTabActive-dark@2x.png",
            "AppsTab.imageset/AppsTab@2x.png",
            "AppsTab.imageset/AppsTab-dark@2x.png",
            "AppsTabActive.imageset/AppsTabActive@2x.png",
            "AppsTabActive.imageset/AppsTabActive-dark@2x.png",
            "GoogleSignInMark.imageset/google.svg",
            "LearnCardPaintedMark.imageset/LearnCardPaintedMark.svg",
            "LearnCardPaintedMark.imageset/LearnCardPaintedMark-dark.svg",
            "BuilderPinkRays.imageset/BuilderPinkRays.svg",
            "AccessPassportIllustration.imageset/AccessPassportIllustration.svg",
            "HomeInboxIllustration.imageset/HomeInboxIllustration.svg",
        )
        eachFile { path = name }
        includeEmptyDirs = false
    }
}

val prepareAccountRuntime = tasks.register<Exec>("prepareAccountRuntime") {
    workingDir = repoRoot
    commandLine(
        "bash",
        "-lc",
        "export PATH=\"\$HOME/.bun/bin:\$PATH\"; bun apps/learncard-native/scripts/prepare-account.ts",
    )
    inputs.file(repoRoot.resolve("apps/learncard-native/account-runtime/runtime.ts"))
    inputs.file(rootProject.file("host/ens-normalize-stub.js"))
    inputs.file(repoRoot.resolve("apps/learncard-native/scripts/prepare-account.ts"))
    outputs.file(file("src/main/assets/account-sdk.js"))
}

val hostQuickJs = tasks.register<Exec>("hostQuickJs") {
    val out = layout.buildDirectory.dir("host")
    outputs.dir(out)
    inputs.file("src/main/cpp/jni.c")
    inputs.file("src/main/cpp/build-host.sh")
    inputs.dir(rootProject.file("third_party/quickjs"))
    commandLine("bash", "src/main/cpp/build-host.sh", out.get().asFile.absolutePath)
}

tasks.named("preBuild") {
    dependsOn(copyNativeAssets, prepareAccountRuntime)
}

tasks.withType<Test>().configureEach {
    dependsOn(hostQuickJs, prepareAccountRuntime, copyNativeAssets)
    val library = layout.buildDirectory.file("host/liblearncardquickjs.so").get().asFile
    systemProperty("learncard.quickjs.lib", library.absolutePath)
    systemProperty("learncard.account.bundle", file("src/main/assets/account-sdk.js").absolutePath)
    systemProperty("learncard.prelude", rootProject.file("host/prelude.js").absolutePath)
    systemProperty("learncard.catalog", repoRoot.resolve("apps/learncard-native/localization/Localizable.xcstrings").absolutePath)
    systemProperty("learncard.screenshots", repoRoot.resolve("apps/learncard-native/artifacts/android").absolutePath)
    maxHeapSize = "2g"
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.foundation:foundation")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.14.1")
    testImplementation("androidx.compose.ui:ui-test-junit4")
    testImplementation("androidx.test:core:1.6.1")
    testImplementation("org.json:json:20240303")
}
