import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.GRAPHQL_ENDPOINT || 'http://127.0.0.1:54321/graphql/v1',
  documents: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  generates: {
    './lib/apollo/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
      ],
      config: {
        enumsAsTypes: true,
        namingConvention: {
          typeNames: 'pascal-case#pascalCase',
          fieldNames: 'pascal-case#pascalCase',
          transformUnderscore: true,
        },
        avoidOptionals: false,
        skipTypename: false,
        documentMode: 'documentNode',
        useTypeImports: true,
        scalars: {
          BigFloat: 'number',
          BigInt: 'string',
          Cursor: 'string',
          Date: 'string',
          Datetime: 'string',
          JSON: 'Record<string, unknown>',
          Opaque: 'string',
          Time: 'string',
          UUID: 'string',
        },
      },
    },
  }
};

export default config;
