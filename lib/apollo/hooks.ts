import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import type { 
  GetProfilesQuery, 
  GetProfilesQueryVariables,
  GetProfileByIdQuery,
  GetProfileByIdQueryVariables,
  GetCurrentUserProfileQuery,
  GetCurrentUserProfileQueryVariables,
  InsertProfileMutation,
  InsertProfileMutationVariables,
  UpdateProfileMutation,
  UpdateProfileMutationVariables,
  DeleteProfileMutation,
  DeleteProfileMutationVariables,
  SearchProfilesQuery,
  SearchProfilesQueryVariables,
  GetProfilesPaginatedQuery,
  GetProfilesPaginatedQueryVariables,
  ProfilesInsertInput,
  ProfilesUpdateInput
} from './generated/graphql';
import { 
  GET_PROFILES,
  GET_PROFILE_BY_ID,
  GET_CURRENT_USER_PROFILE,
  INSERT_PROFILE,
  UPDATE_PROFILE,
  DELETE_PROFILE,
  SEARCH_PROFILES,
  GET_PROFILES_PAGINATED
} from './graphql/queries';

// Query hooks
export const useGetProfiles = (variables?: GetProfilesQueryVariables) => {
  return useQuery<GetProfilesQuery, GetProfilesQueryVariables>(GET_PROFILES, {
    variables,
  });
};

export const useGetProfileById = (variables: GetProfileByIdQueryVariables) => {
  return useQuery<GetProfileByIdQuery, GetProfileByIdQueryVariables>(GET_PROFILE_BY_ID, {
    variables,
  });
};

export const useGetCurrentUserProfile = () => {
  return useQuery<GetCurrentUserProfileQuery, GetCurrentUserProfileQueryVariables>(GET_CURRENT_USER_PROFILE);
};

export const useSearchProfiles = (variables: SearchProfilesQueryVariables) => {
  return useQuery<SearchProfilesQuery, SearchProfilesQueryVariables>(SEARCH_PROFILES, {
    variables,
  });
};

export const useGetProfilesPaginated = (variables?: GetProfilesPaginatedQueryVariables) => {
  return useQuery<GetProfilesPaginatedQuery, GetProfilesPaginatedQueryVariables>(GET_PROFILES_PAGINATED, {
    variables,
  });
};

// Lazy query hooks
export const useLazyGetProfiles = () => {
  return useLazyQuery<GetProfilesQuery, GetProfilesQueryVariables>(GET_PROFILES);
};

export const useLazyGetProfileById = () => {
  return useLazyQuery<GetProfileByIdQuery, GetProfileByIdQueryVariables>(GET_PROFILE_BY_ID);
};

export const useLazySearchProfiles = () => {
  return useLazyQuery<SearchProfilesQuery, SearchProfilesQueryVariables>(SEARCH_PROFILES);
};

// Mutation hooks
export const useInsertProfile = () => {
  return useMutation<InsertProfileMutation, InsertProfileMutationVariables>(INSERT_PROFILE);
};

export const useUpdateProfile = () => {
  return useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UPDATE_PROFILE);
};

export const useDeleteProfile = () => {
  return useMutation<DeleteProfileMutation, DeleteProfileMutationVariables>(DELETE_PROFILE);
};

// Utility hooks
export const useCreateProfile = () => {
  const [insertProfile, { loading, error }] = useInsertProfile();
  
  const createProfile = async (input: ProfilesInsertInput) => {
    try {
      const result = await insertProfile({ variables: { input } });
      return result.data?.insertIntoprofilesCollection;
    } catch (err) {
      throw err;
    }
  };

  return { createProfile, loading, error };
};

export const useEditProfile = () => {
  const [updateProfile, { loading, error }] = useUpdateProfile();
  
  const editProfile = async (id: string, input: ProfilesUpdateInput) => {
    try {
      const result = await updateProfile({ 
        variables: { id, input } 
      });
      return result.data?.updateprofilesCollection;
    } catch (err) {
      throw err;
    }
  };

  return { editProfile, loading, error };
};

export const useRemoveProfile = () => {
  const [deleteProfile, { loading, error }] = useDeleteProfile();
  
  const removeProfile = async (id: string) => {
    try {
      const result = await deleteProfile({ 
        variables: { id } 
      });
      return result.data?.deleteFromprofilesCollection;
    } catch (err) {
      throw err;
    }
  };

  return { removeProfile, loading, error };
};
