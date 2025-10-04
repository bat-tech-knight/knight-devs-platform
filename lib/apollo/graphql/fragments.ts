import { gql } from '@apollo/client';

// Profiles fragment
export const PROFILES_FRAGMENT = gql`
  fragment ProfilesFragment on profiles {
    id
    avatar_url
    first_name
    last_name
    created_at
    updated_at
  }
`;

// PageInfo fragment
export const PAGE_INFO_FRAGMENT = gql`
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

// Combined fragments for reuse
export const PROFILES_WITH_PAGE_INFO = gql`
  ${PROFILES_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;
