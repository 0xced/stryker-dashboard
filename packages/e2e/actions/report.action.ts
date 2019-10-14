import { MutationTestResult, MutantStatus } from 'mutation-testing-report-schema';
import { generateAuthToken } from './auth.action';
import { EnableRepositoryResponse, Repository, Report } from '@stryker-mutator/dashboard-contract';
import axios from 'axios';
import { browser } from 'protractor';

const httpClient = axios.create({ baseURL: browser.baseUrl });

async function enableRepository(repositorySlug: string): Promise<string> {
  const patchBody: Partial<Repository> = { enabled: true };
  const authToken = generateAuthToken();
  const response = await httpClient.patch<EnableRepositoryResponse>(`/api/repositories/${repositorySlug}`, patchBody, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  return response.data.apiKey;
}

export async function uploadReport(repositorySlug: string, version: string, result: MutationTestResult) {
  const apiKey = await enableRepository(repositorySlug);
  const putBody: Pick<Report, 'result'> = {
    result
  };
  await httpClient.put(`/api/reports/${repositorySlug}/${version}`, putBody, {
    headers: {
      ['X-Api-Key']: apiKey
    }
  });
}

export function simpleReport(): MutationTestResult {
  return {
    schemaVersion: '1.1',
    thresholds: {
      high: 80,
      low: 60
    },
    files: {
      'test.js': {
        language: 'javascript',
        source: '"use strict";\nfunction add(a, b) {\n  return a + b;\n}',
        mutants: [
          {
            id: '3',
            location: {
              start: {
                column: 1,
                line: 1
              },
              end: {
                column: 13,
                line: 1
              }
            },
            replacement: '""',
            mutatorName: 'String Literal',
            status: MutantStatus.Survived
          },
          {
            id: '1',
            mutatorName: 'Arithmetic Operator',
            replacement: '-',
            location: {
              start: {
                line: 3,
                column: 12
              },
              end: {
                line: 3,
                column: 13
              }
            },
            status: MutantStatus.Survived
          },
          {
            id: '2',
            mutatorName: 'Block Statement',
            replacement: '{}',
            location: {
              start: {
                line: 2,
                column: 20
              },
              end: {
                line: 4,
                column: 1
              }
            },
            status: MutantStatus.Killed
          }
        ]
      }
    }
  };
}