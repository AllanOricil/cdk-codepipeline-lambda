import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DockerImagePipelineProps } from 'types';
import { LambdaFunctionTrigger } from './lambda-function-trigger';

export class DockerImagePipeline extends Construct {
  constructor(scope: Construct, id: string, props: DockerImagePipelineProps) {
    super(scope, id);

    const codebuildProject = new codebuild.PipelineProject(this, `${props.codecommitRepository.repositoryName}-codebuild-project`, {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      environment: { 
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
        environmentVariables: {
          'AWS_ACCOUNT_ID': {
            value: cdk.Stack.of(this).account
          },
          'IMAGE_REPO_NAME': {
            value: props.codecommitRepository.repositoryName
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
    
    props.branches.forEach((branch) => {
      const sourceOutput = new codepipeline.Artifact();
      const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit',
        repository: props.codecommitRepository,
        output: sourceOutput,
        branch
      });

      const buildAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'CodeBuild',
        project: codebuildProject,
        input: sourceOutput
      });

      new codepipeline.Pipeline(this, `${props.codecommitRepository.repositoryName}-${branch}-codepipeline-pipeline`, {
        pipelineName: `${props.codecommitRepository.repositoryName}-${branch}-docker-build`,
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
    })
    
    new ecr.Repository(this, `${props.codecommitRepository.repositoryName}-ecr-repository`, {
      repositoryName: `${props.codecommitRepository.repositoryName}`,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new LambdaFunctionTrigger(this, 'lambda-function-trigger', {
      codecommitRepository: props.codecommitRepository
    });

  }
}
