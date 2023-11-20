import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DockerImagePipelineProps } from './types';

export class DockerImagePipeline extends Construct {
  constructor(scope: Construct, id: string, props: DockerImagePipelineProps) {
    super(scope, id);

    const codecommitRepository = codecommit.Repository.fromRepositoryArn(this, `${props.repository.name}-codecommit-repository`, props.repository.arn) 

    const codebuildProject = new codebuild.PipelineProject(this, `${props.repository.name}-codebuild-project`, {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      environment: { 
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
        environmentVariables: {
          'AWS_ACCOUNT_ID': {
            value: cdk.Stack.of(this).account
          }
        }
      },
    });

    codebuildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ecr:GetDownloadUrlForLayer',
        'ecr:PutImage',
        'ecr:InitiateLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:CompleteLayerUpload',
        'ecr:DescribeRepositories',
        'ecr:GetRepositoryPolicy',
        'ecr:ListImages',
        'ecr:DeleteRepository',
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:BatchGetImage'
      ], 
      resources: ['*']
    }));

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommit',
      repository: codecommitRepository,
      output: sourceOutput,
      branch: 'main'
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project: codebuildProject,
      input: sourceOutput
    });
    

    new codepipeline.Pipeline(this, `${props.repository.name}-codepipeline-pipeline`, {
      pipelineName: `${props.repository.name}-docker-image-pipeline`,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
      ],
    });


    new ecr.Repository(this, `${props.repository.name}-ecr-repository`, {
      repositoryName: `${props.repository.name}`,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });


    new events.Rule(this, `${props.repository.name}-event-rule`, {
      ruleName: `${props.repository.name}-event-rule`,
      description: `Trigger on commit to ${props.repository.name} codecommit repository`,
      eventPattern: {
        source: ['aws.codecommit'],
        detailType: ['CodeCommit Repository State Change'],
        resources: [codecommitRepository.repositoryArn],
        detail: {
          event: ['referenceCreated', 'referenceUpdated'],
        },
      },
      enabled: true,
      targets: [
        // you can replace this with the arn of lambda function or any other resource
        new events_targets.LambdaFunction(props.triggerFunction)
      ],
    });

  }
}
