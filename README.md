# Codepipeline for Docker Images

This CDK project creates codepipelines to build and push docker images to ECR. A Lambda function controls when a codepipeline is triggered so that is possible to have better control of when pipelines must start.

![architecture-diagram](./images/codepipeline-docker-images.svg)

## Requirements

```bash
node		>= 18.18.0
npm			>= 9.8.1
cdk 		>= 2.102.0
aws-cli    	>= 2.11.15
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
