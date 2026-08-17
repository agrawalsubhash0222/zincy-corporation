const {
  withAndroidManifest,
  withAppDelegate,
  withInfoPlist,
  withProjectBuildGradle,
} = require("expo/config-plugins");

const PHONEPE_MAVEN =
  "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android";

const IOS_QUERY_SCHEMES = [
  "ppemerchantsdkv1",
  "ppemerchantsdkv2",
  "ppemerchantsdkv3",
  "phonepe",
];

function withPhonePeMaven(config) {
  return withProjectBuildGradle(config, (project) => {
    if (project.modResults.language !== "groovy") return project;
    if (project.modResults.contents.includes(PHONEPE_MAVEN)) return project;

    const repository = `maven {\n      url "${PHONEPE_MAVEN}"\n    }`;
    const allProjects = /(allprojects\s*\{[\s\S]*?repositories\s*\{)/m;

    if (allProjects.test(project.modResults.contents)) {
      project.modResults.contents = project.modResults.contents.replace(
        allProjects,
        `$1\n    ${repository}`,
      );
    } else {
      project.modResults.contents += `\n\nallprojects {\n  repositories {\n    google()\n    mavenCentral()\n    ${repository}\n  }\n}\n`;
    }
    return project;
  });
}

function withPhonePeAndroidQuery(config) {
  return withAndroidManifest(config, (android) => {
    const manifest = android.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];
    queries.package = queries.package ?? [];

    if (!queries.package.some((entry) => entry.$?.["android:name"] === "com.phonepe.app")) {
      queries.package.push({ $: { "android:name": "com.phonepe.app" } });
    }

    return android;
  });
}

function withPhonePeInfoPlist(config) {
  return withInfoPlist(config, (ios) => {
    const existing = ios.modResults.LSApplicationQueriesSchemes ?? [];
    ios.modResults.LSApplicationQueriesSchemes = [
      ...new Set([...existing, ...IOS_QUERY_SCHEMES]),
    ];
    return ios;
  });
}

function withPhonePeAppDelegate(config) {
  return withAppDelegate(config, (ios) => {
    if (ios.modResults.language !== "swift") return ios;

    const notification = "ApplicationOpenURLNotification";
    if (ios.modResults.contents.includes(notification)) return ios;

    const openUrlMethod = /(override func application\(\s*_ app: UIApplication,\s*open url: URL,\s*options:[\s\S]*?\) -> Bool \{\s*\n)/m;
    if (!openUrlMethod.test(ios.modResults.contents)) {
      throw new Error(
        "PhonePe setup could not find the iOS open-URL handler in AppDelegate.swift.",
      );
    }

    ios.modResults.contents = ios.modResults.contents.replace(
      openUrlMethod,
      `$1    NotificationCenter.default.post(\n      name: Notification.Name("${notification}"),\n      object: nil,\n      userInfo: ["openUrl": url, "options": options]\n    )\n`,
    );
    return ios;
  });
}

module.exports = function withPhonePe(config) {
  config = withPhonePeMaven(config);
  config = withPhonePeAndroidQuery(config);
  config = withPhonePeInfoPlist(config);
  config = withPhonePeAppDelegate(config);
  return config;
};
