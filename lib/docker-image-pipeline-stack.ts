import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DockerImagePipeline } from './docker-image-pipeline';
import { CodecommitRepository } from './types';

export class DockerImagePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const repositories : Array<CodecommitRepository> = [
      {
        name: 'test-docker-image-pipeline',
        arn: 'arn:aws:codecommit:us-east-2:845044614340:test-docker-image-pipeline'
      },
      {
        name: 'test-docker-image-pipeline-2',
        arn: 'arn:aws:codecommit:us-east-2:845044614340:test-docker-image-pipeline-2'
      }
    ]

    const dockerImagePipelineTriggerFunction = new NodejsFunction(this, 'docker-image-pipeline-trigger', {
      functionName: 'docker-image-pipeline-trigger',
      entry: path.resolve(
        __dirname,
        `../resources/lambda/handlers/docker-image-pipeline-trigger/index.ts`,
      ),
      handler: "main",
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: cdk.Size.mebibytes(128).toMebibytes(),
      retryAttempts: 0,
      environment: {
        NODE_ENV: process.env.NODE_ENV ?? "production",
        LOG_LEVEL: "info",
      },
      bundling: {
        nodeModules: ["winston", "ignore"],
        externalModules: ["aws-sdk", "@aws-sdk/*"],
        loader: {
          ".ts" : "ts"
        },
      }
    });

    const policy = new iam.PolicyStatement({
      actions: [
        'codecommit:GetFile',
        'codecommit:GetDifferences',
        'codepipeline:StartPipelineExecution'
      ],
      resources: ['*'],
    });

    dockerImagePipelineTriggerFunction.addToRolePolicy(policy);

    const dockerImagePipelines = [];
    repositories.forEach((repository) => {
      dockerImagePipelines.push(
        new DockerImagePipeline(this, repository.name, { 
          repository: repository,
          triggerFunction: dockerImagePipelineTriggerFunction
        })
      )
    })

    


  }
}
