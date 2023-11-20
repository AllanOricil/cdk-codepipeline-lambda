import * as codecommit from 'aws-cdk-lib/aws-codecommit';

export interface DockerImagePipelineProps {
	codecommitRepository: codecommit.IRepository
	branches: string[]
}

export interface LambdaFunctionTriggerProps {
	codecommitRepository: codecommit.IRepository
}

export interface CodeCommitReferenceEventDetail {
	event: 'referenceCreated' | 'referenceUpdated'
	referenceType: string
	commitId: string
	repositoryName: string
	referenceName: string
	referenceFullName: string
}
  
export interface CodeCommitEvent {
	version: string
	id: string
	'detail-type': string
	source: string
	account: string
	time: string
	region: string
	resources: string[]
	detail: CodeCommitReferenceEventDetail
}