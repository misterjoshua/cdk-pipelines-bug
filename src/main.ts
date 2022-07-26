import { App, DockerImage, SecretValue, Stack, Stage } from 'aws-cdk-lib';
import * as aws_s3_assets from 'aws-cdk-lib/aws-s3-assets';
import * as pipelines from 'aws-cdk-lib/pipelines';

const app = new App();

const pipelineStack = new Stack(app, 'cdk-pipelines-bug-dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const pipeline = new pipelines.CodePipeline(pipelineStack, 'CodePipeline', {
  synth: new pipelines.ShellStep('Synth', {
    input: pipelines.CodePipelineSource.gitHub('misterjoshua/cdk-pipelines-bug', 'main', {
      authentication: SecretValue.secretsManager('github-token'),
    }),
    commands: [
      'yarn install',
      'yarn build',
    ],
  }),

  dockerEnabledForSynth: true,
});


const stage = new Stage(pipelineStack, 'Stage');
const stageStack = new Stack(stage, 'Stack');

new aws_s3_assets.Asset(stageStack, 'Asset', {
  path: __dirname,
  bundling: {
    // Generate a difficult to compress, large file. (512MB)
    image: DockerImage.fromRegistry('bash'),
    command: ['dd', 'if=/dev/urandom', 'of=/asset-output/big.dat', 'bs=1048576', 'count=512'],
  },
});

pipeline.addStage(stage);


app.synth();