import { Handler, Context } from 'aws-lambda';
import { CodeCommitClient, GetFileCommand, GetDifferencesCommand } from "@aws-sdk/client-codecommit";
import { CodePipelineClient, StartPipelineExecutionCommand } from "@aws-sdk/client-codepipeline";
import logger from "@services/logger.mjs";
import ignore from 'ignore'

const codeCommitClient = new CodeCommitClient({});
const codePipelineClient = new CodePipelineClient({});

interface CodeCommitRefEventDetail {
  event: 'referenceCreated' | 'referenceUpdated'
  referenceType: string
  commitId: string
  repositoryName: string
  referenceName: string
  referenceFullName: string
}

interface CodeCommitEvent {
  version: string
  id: string
  'detail-type': string
  source: string
  account: string
  time: string
  region: string
  resources: string[]
  detail: CodeCommitRefEventDetail
}

export const main: Handler = async function (event: CodeCommitEvent, context: Context) {
  logger.defaultMeta = { requestId: context.awsRequestId };
  logger.info(JSON.stringify(event));

  const oldCommitId = event.detail.oldCommitId;
  const newCommitId = event.detail.commitId;
  const repositoryName = event.detail.repositoryName;

  try{
    let ignoreFile;
    try{
      const { fileContent } = await codeCommitClient.send(
        new GetFileCommand({
          repositoryName: repositoryName,
          commitSpecifier: newCommitId,
          filePath: ".buildspecignore",
        })
      );

      logger.debug(fileContent);
      ignoreFile = Buffer.from(fileContent, 'base64').toString('utf-8');
      logger.info(ignoreFile);
    } catch(error){
      logger.info('ignore file not present', error)
    }
    

    const { differences } = await codeCommitClient.send(
      new GetDifferencesCommand({
        repositoryName: repositoryName,
        beforeCommitSpecifier: oldCommitId,
        afterCommitSpecifier: newCommitId
      })
    );

    logger.debug(differences);
    const ig = ignore().add(ignoreFile);
    for(const difference of differences){
      const fileName = difference.afterBlob?.path;
      logger.debug(fileName);
      const filteredPaths = ig.filter([fileName]);
      logger.debug(filteredPaths)
      if(filteredPaths.length){
        await codePipelineClient.send(
          new StartPipelineExecutionCommand({
            name: `${repositoryName}-docker-image-pipeline`,
            variables: [
              {
                name: 'IMAGE_REPO_NAME',
                value: repositoryName
              },
              {
                name: 'IMAGE_TAG',
                value: newCommitId
              }
            ]
          })
        )
        logger.info(`${repositoryName}-docker-image-pipeline started`)
        break;
      }
    }

    return;
  }catch(error){
    logger.error(`could not start ${repositoryName}-docker-image-pipeline`, error);
    throw new Error(`could not start ${repositoryName}-docker-image-pipeline`)
  }
};
