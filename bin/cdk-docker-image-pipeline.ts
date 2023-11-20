#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DockerImagePipelineStack } from '../lib/docker-image-pipeline-stack';

const app = new cdk.App();
new DockerImagePipelineStack(app, 'docker-image-pipelines-stack', {
  env: { account: '845044614340', region: 'us-east-2' }
});