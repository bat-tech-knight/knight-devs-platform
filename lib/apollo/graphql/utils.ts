import { gql } from '@apollo/client';

/**
 * Helper function to create GraphQL fragments
 */
export const createFragment = (name: string, type: string, fields: string) => {
  return gql`
    fragment ${name} on ${type} {
      ${fields}
    }
  `;
};

/**
 * Common GraphQL fragments
 */
export const USER_FRAGMENT = createFragment(
  'UserFragment',
  'User',
  `
    id
    email
    name
    createdAt
    updatedAt
  `
);

export const PROFILES_FRAGMENT = createFragment(
  'ProfilesFragment',
  'profiles',
  `
    id
    avatar_url
    first_name
    last_name
    created_at
    updated_at
  `
);

export const PAGE_INFO_FRAGMENT = createFragment(
  'PageInfoFragment',
  'PageInfo',
  `
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  `
);

export const POST_FRAGMENT = createFragment(
  'PostFragment',
  'Post',
  `
    id
    title
    content
    author {
      ...UserFragment
    }
    createdAt
    updatedAt
  `
);
