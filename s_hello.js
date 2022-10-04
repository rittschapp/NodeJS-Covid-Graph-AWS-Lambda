
var serverlessSDK = require('./serverless_sdk/index.js');
serverlessSDK = new serverlessSDK({
  orgId: 'philiprittscher',
  applicationName: 'covid19',
  appUid: '1tndlp6JsKmyrbXf0B',
  orgUid: 'hK7jsKHmXyY1xHNMcV',
  deploymentUid: 'fd3ffd77-aae0-4493-b409-cb6f83904c53',
  serviceName: 'covid19',
  shouldLogMeta: true,
  shouldCompressLogs: true,
  disableAwsSpans: false,
  disableHttpSpans: false,
  stageName: 'dev',
  serverlessPlatformStage: 'prod',
  devModeEnabled: false,
  accessKey: null,
  pluginVersion: '4.0.4',
  disableFrameworksInstrumentation: false
});

const handlerWrapperArgs = { functionName: 'covid19-dev-hello', timeout: 6 };

try {
  const userHandler = require('./handler.js');
  module.exports.handler = serverlessSDK.handler(userHandler.hello, handlerWrapperArgs);
} catch (error) {
  module.exports.handler = serverlessSDK.handler(() => { throw error }, handlerWrapperArgs);
}