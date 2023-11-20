import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';
import { DockerImagePipeline } from './constructs/docker-image-pipeline';

export class DockerImagePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const dockerImagePipelines = [
      {
        codecommitRepository: codecommit.Repository.fromRepositoryArn(
          this,
          'test-docker-image-pipeline-codecommit-repository', 
          'arn:aws:codecommit:us-east-2:845044614340:test-docker-image-pipeline'
        ),
        branches: [
          'main',
          'develop'
        ]
      },
      {
        codecommitRepository: codecommit.Repository.fromRepositoryArn(
          this,
          'test-docker-image-pipeline2-codecommit-repository',
          'arn:aws:codecommit:us-east-2:845044614340:test-docker-image-pipeline-2'
        ),
        branches: [
          'main',
          'develop'
        ]
      }
    ]
    
    dockerImagePipelines.forEach((dockerImagePipeline) => {
      new DockerImagePipeline(this, `${dockerImagePipeline.codecommitRepository.repositoryName}-docker-image-pipeline`, dockerImagePipeline)
    })

  }
}
