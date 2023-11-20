import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaFunctionTriggerProps } from 'types';

export class LambdaFunctionTrigger extends Construct {
  constructor(scope: Construct, id: string, props: LambdaFunctionTriggerProps) {
    super(scope, id);

    const triggerFunction = new NodejsFunction(this, `${props.codecommitRepository.repositoryName}-trigger-function`, {
		functionName: `${props.codecommitRepository.repositoryName}-trigger-function`,
		entry: path.resolve(
		  __dirname,
		  `../../resources/lambda/handlers/docker-image-pipeline-trigger/index.ts`,
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
	
	  triggerFunction.addToRolePolicy(policy);

	  new events.Rule(this, `${props.codecommitRepository.repositoryName}-event-rule`, {
		ruleName: `${props.codecommitRepository.repositoryName}-event-rule`,
		description: `Trigger on commit to ${props.codecommitRepository.repositoryName} codecommit repository`,
		eventPattern: {
		  source: ['aws.codecommit'],
		  detailType: ['CodeCommit Repository State Change'],
		  resources: [props.codecommitRepository.repositoryArn],
		  detail: {
			event: ['referenceCreated', 'referenceUpdated'],
		  },
		},
		enabled: true,
		targets: [
		  new events_targets.LambdaFunction(triggerFunction)
		],
	  });
  }
}





