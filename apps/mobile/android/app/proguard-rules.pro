# ProGuard / R8 rules for WanderPin release builds.
#
# Appended to the defaults from getDefaultProguardFile("proguard-android.txt").
# Most libraries here ship their own consumerProguardFiles, which R8 applies
# automatically — these rules cover the cases that reflection or JNI would
# otherwise break. Anything removed here fails at runtime, not at build time.

# ─── React Native core: JNI + bridge reflection ───────────────────────────────
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStripAny
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.proguard.annotations.DoNotStripAny class * { *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.devsupport.** { *; }

# New architecture is on (newArchEnabled=true) — TurboModules and Fabric are
# resolved by name through JNI, so they cannot be renamed.
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.viewmanagers.** { *; }

# ─── Expo modules: annotation-driven module registration ──────────────────────
-keep class expo.modules.** { *; }
-keep class * extends expo.modules.core.interfaces.Package { *; }
-keep class * extends expo.modules.kotlin.modules.Module { *; }
-keepclassmembers class * { @expo.modules.core.interfaces.ExpoMethod *; }

# ─── Reanimated + Worklets ────────────────────────────────────────────────────
# Worklets are compiled to strings and resolved reflectively at runtime.
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.swmansion.common.** { *; }

# ─── Gesture Handler, Screens, SafeArea ──────────────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# ─── MapLibre ─────────────────────────────────────────────────────────────────
# Heavy JNI surface between the native renderer and the Java bindings.
-keep class org.maplibre.** { *; }
-dontwarn org.maplibre.**

# ─── Lottie, SVG ──────────────────────────────────────────────────────────────
-keep class com.airbnb.lottie.** { *; }
-dontwarn com.airbnb.lottie.**
-keep public class com.horcrux.svg.** { *; }

# ─── Google Sign-In / Play Services ───────────────────────────────────────────
# Play Services ships correct consumer rules; blanket-keeping it would undo most
# of the dex shrink. Suppress warnings only.
-dontwarn com.google.android.gms.**
-dontwarn com.google.errorprone.annotations.**

# ─── Networking ───────────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# ─── Kotlin ───────────────────────────────────────────────────────────────────
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# Keep the stack traces in release crash reports readable.
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
