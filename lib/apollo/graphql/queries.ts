import { gql } from '@apollo/client';
import { PROFILES_FRAGMENT, PROFILES_WITH_PAGE_INFO } from './fragments';

// Supabase Profiles queries
export const GET_PROFILES = gql`
  ${PROFILES_WITH_PAGE_INFO}
  query GetProfiles($limit: Int, $offset: Int) {
    profilesCollection(first: $limit, offset: $offset) {
      edges {
        node {
          ...ProfilesFragment
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
`;

export const GET_PROFILE_BY_ID = gql`
  ${PROFILES_FRAGMENT}
  query GetProfileById($id: UUID!) {
    profilesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          ...ProfilesFragment
        }
      }
    }
  }
`;

export const GET_CURRENT_USER_PROFILE = gql`
  ${PROFILES_FRAGMENT}
  query GetCurrentUserProfile {
    profilesCollection {
      edges {
        node {
          ...ProfilesFragment
        }
      }
    }
  }
`;

// Supabase Profiles mutations
export const INSERT_PROFILE = gql`
  ${PROFILES_FRAGMENT}
  mutation InsertProfile($input: profilesInsertInput!) {
    insertIntoprofilesCollection(objects: [$input]) {
      records {
        ...ProfilesFragment
      }
    }
  }
`;

export const UPDATE_PROFILE = gql`
  ${PROFILES_FRAGMENT}
  mutation UpdateProfile($id: UUID!, $input: profilesUpdateInput!) {
    updateprofilesCollection(filter: { id: { eq: $id } }, set: $input) {
      records {
        ...ProfilesFragment
      }
    }
  }
`;

export const DELETE_PROFILE = gql`
  mutation DeleteProfile($id: UUID!) {
    deleteFromprofilesCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

// Example query for searching profiles
export const SEARCH_PROFILES = gql`
  ${PROFILES_FRAGMENT}
  query SearchProfiles($searchTerm: String!) {
    profilesCollection(
      filter: {
        or: [
          { first_name: { ilike: $searchTerm } }
          { last_name: { ilike: $searchTerm } }
        ]
      }
    ) {
      edges {
        node {
          ...ProfilesFragment
        }
      }
    }
  }
`;

// Query for profiles with pagination
export const GET_PROFILES_PAGINATED = gql`
  ${PROFILES_WITH_PAGE_INFO}
  query GetProfilesPaginated($first: Int, $after: Cursor) {
    profilesCollection(first: $first, after: $after) {
      edges {
        node {
          ...ProfilesFragment
        }
        cursor
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
`;
