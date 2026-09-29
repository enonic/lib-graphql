import com.github.gradle.node.pnpm.task.PnpmTask

plugins {
    java
    jacoco
    `maven-publish`
    id("com.enonic.xp.base")
    alias(libs.plugins.enonic.defaults)
    alias(libs.plugins.node.gradle)
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

xp {
    scriptEngines = listOf("Nashorn", "GraalJS")
}

repositories {
    mavenLocal()
    mavenCentral()
    xp.enonicRepo("dev")
}

dependencies {
    compileOnly(xplibs.api.script)

    implementation(libs.graphql.java)
    implementation(libs.graphql.java.extended.scalars)

    testImplementation(platform(libs.junit.bom))
    testImplementation(platform(libs.mockito.bom))
    testImplementation(xplibs.testing)
    testImplementation(libs.junit.jupiter)
    testImplementation(libs.mockito.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}

node {
    download = true
    version = "24.19.0"
    pnpmVersion = "11.23.0"
}

val environmentShort = if (providers.gradleProperty("env").orNull == "dev") "dev" else "prod"
val nodeEnvironment = if (environmentShort == "dev") "development" else "production"

fun pnpmCheck(taskName: String, script: String) =
    tasks.register<PnpmTask>(taskName) {
        dependsOn(tasks.named("pnpmInstall"))
        args = listOf("run", script)
        environment = mapOf("FORCE_COLOR" to "true")
    }

pnpmCheck("checkTypes", "check:types")
pnpmCheck("checkLint", "check:lint")

val esbuildOutput = layout.buildDirectory.dir("esbuild")

val pnpmBuild = tasks.register<PnpmTask>("pnpmBuild") {
    dependsOn(tasks.named("pnpmInstall"))
    args = listOf("run", "build:$environmentShort")
    environment = mapOf("FORCE_COLOR" to "true", "NODE_ENV" to nodeEnvironment)
    inputs.dir("src/main/resources")
    inputs.file("esbuild.config.js")
    inputs.file("package.json")
    inputs.file("pnpm-lock.yaml")
    inputs.file("tsconfig.json")
    outputs.dir(esbuildOutput)
    // esbuild never prunes outdir, so a removed entry point would keep shipping until the next clean
    val staleOutput = esbuildOutput.get().asFile
    doFirst { staleOutput.deleteRecursively() }
}

// @enonic-types/lib-graphql, published from build/types by release-tools on release builds
val typesOutput = layout.buildDirectory.dir("types")

val buildTypes = tasks.register<PnpmTask>("buildTypes") {
    dependsOn(tasks.named("pnpmInstall"))
    args = listOf("run", "build:types")
    environment = mapOf("FORCE_COLOR" to "true")
    inputs.dir("src/main/resources")
    inputs.files("types/package.json", "types/README.md", "types/build.mjs", "LICENSE.txt")
    inputs.files("gradle.properties", "package.json", "pnpm-lock.yaml", "tsconfig.json", "tsconfig.types.json")
    outputs.dir(typesOutput)
    outputs.dir(layout.buildDirectory.dir("types-dts"))
}

// verify:types, not test:types — the latter regenerates build/types, which is buildTypes' output
val testTypes = pnpmCheck("testTypes", "verify:types")
testTypes.configure { dependsOn(buildTypes) }

tasks.named("assemble") {
    dependsOn(buildTypes)
}

tasks.named<ProcessResources>("processResources") {
    exclude("**/*.ts")
    includeEmptyDirs = false
    from(pnpmBuild)
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

tasks.named<JacocoReport>("jacocoTestReport") {
    reports {
        xml.required = true
        html.required = true
    }
}

tasks.named("check") {
    dependsOn("checkTypes", "checkLint", testTypes, tasks.named("jacocoTestReport"))
}
