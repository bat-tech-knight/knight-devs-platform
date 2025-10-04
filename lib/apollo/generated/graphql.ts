export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigFloat: { input: number; output: number; }
  BigInt: { input: string; output: string; }
  Cursor: { input: string; output: string; }
  Date: { input: string; output: string; }
  Datetime: { input: string; output: string; }
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
  Opaque: { input: string; output: string; }
  Time: { input: string; output: string; }
  UUID: { input: string; output: string; }
};

/** Boolean expression comparing fields on type "BigFloat" */
export type BigFloatFilter = {
  eq?: InputMaybe<Scalars['BigFloat']['input']>;
  gt?: InputMaybe<Scalars['BigFloat']['input']>;
  gte?: InputMaybe<Scalars['BigFloat']['input']>;
  in?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigFloat']['input']>;
  lte?: InputMaybe<Scalars['BigFloat']['input']>;
  neq?: InputMaybe<Scalars['BigFloat']['input']>;
};

/** Boolean expression comparing fields on type "BigFloatList" */
export type BigFloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigFloat']['input']>>;
};

/** Boolean expression comparing fields on type "BigInt" */
export type BigIntFilter = {
  eq?: InputMaybe<Scalars['BigInt']['input']>;
  gt?: InputMaybe<Scalars['BigInt']['input']>;
  gte?: InputMaybe<Scalars['BigInt']['input']>;
  in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['BigInt']['input']>;
  lte?: InputMaybe<Scalars['BigInt']['input']>;
  neq?: InputMaybe<Scalars['BigInt']['input']>;
};

/** Boolean expression comparing fields on type "BigIntList" */
export type BigIntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contains?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  eq?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

/** Boolean expression comparing fields on type "Boolean" */
export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Boolean expression comparing fields on type "BooleanList" */
export type BooleanListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  contains?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  eq?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression comparing fields on type "Date" */
export type DateFilter = {
  eq?: InputMaybe<Scalars['Date']['input']>;
  gt?: InputMaybe<Scalars['Date']['input']>;
  gte?: InputMaybe<Scalars['Date']['input']>;
  in?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
  neq?: InputMaybe<Scalars['Date']['input']>;
};

/** Boolean expression comparing fields on type "DateList" */
export type DateListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Date']['input']>>;
  contains?: InputMaybe<Array<Scalars['Date']['input']>>;
  eq?: InputMaybe<Array<Scalars['Date']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Date']['input']>>;
};

/** Boolean expression comparing fields on type "Datetime" */
export type DatetimeFilter = {
  eq?: InputMaybe<Scalars['Datetime']['input']>;
  gt?: InputMaybe<Scalars['Datetime']['input']>;
  gte?: InputMaybe<Scalars['Datetime']['input']>;
  in?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Datetime']['input']>;
  lte?: InputMaybe<Scalars['Datetime']['input']>;
  neq?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Boolean expression comparing fields on type "DatetimeList" */
export type DatetimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  contains?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  eq?: InputMaybe<Array<Scalars['Datetime']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Datetime']['input']>>;
};

export type FilterIs =
  | 'NOT_NULL'
  | 'NULL';

/** Boolean expression comparing fields on type "Float" */
export type FloatFilter = {
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  neq?: InputMaybe<Scalars['Float']['input']>;
};

/** Boolean expression comparing fields on type "FloatList" */
export type FloatListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Float']['input']>>;
  contains?: InputMaybe<Array<Scalars['Float']['input']>>;
  eq?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Float']['input']>>;
};

/** Boolean expression comparing fields on type "ID" */
export type IdFilter = {
  eq?: InputMaybe<Scalars['ID']['input']>;
};

/** Boolean expression comparing fields on type "Int" */
export type IntFilter = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
};

/** Boolean expression comparing fields on type "IntList" */
export type IntListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Int']['input']>>;
  contains?: InputMaybe<Array<Scalars['Int']['input']>>;
  eq?: InputMaybe<Array<Scalars['Int']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** The root type for creating and mutating data */
export type Mutation = {
  __typename?: 'Mutation';
  /** Deletes zero or more records from the `profiles` collection */
  deleteFromprofilesCollection: ProfilesDeleteResponse;
  /** Adds one or more `profiles` records to the collection */
  insertIntoprofilesCollection?: Maybe<ProfilesInsertResponse>;
  /** Updates zero or more records in the `profiles` collection */
  updateprofilesCollection: ProfilesUpdateResponse;
};


/** The root type for creating and mutating data */
export type MutationDeleteFromprofilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProfilesFilter>;
};


/** The root type for creating and mutating data */
export type MutationInsertIntoprofilesCollectionArgs = {
  objects: Array<ProfilesInsertInput>;
};


/** The root type for creating and mutating data */
export type MutationUpdateprofilesCollectionArgs = {
  atMost?: Scalars['Int']['input'];
  filter?: InputMaybe<ProfilesFilter>;
  set: ProfilesUpdateInput;
};

export type Node = {
  /** Retrieves a record by `ID` */
  nodeId: Scalars['ID']['output'];
};

/** Boolean expression comparing fields on type "Opaque" */
export type OpaqueFilter = {
  eq?: InputMaybe<Scalars['Opaque']['input']>;
  is?: InputMaybe<FilterIs>;
};

/** Defines a per-field sorting order */
export type OrderByDirection =
  /** Ascending order, nulls first */
  | 'AscNullsFirst'
  /** Ascending order, nulls last */
  | 'AscNullsLast'
  /** Descending order, nulls first */
  | 'DescNullsFirst'
  /** Descending order, nulls last */
  | 'DescNullsLast';

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** The root type for querying data */
export type Query = {
  __typename?: 'Query';
  /** Retrieve a record by its `ID` */
  node?: Maybe<Node>;
  /** A pagable collection of type `profiles` */
  profilesCollection?: Maybe<ProfilesConnection>;
};


/** The root type for querying data */
export type QueryNodeArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root type for querying data */
export type QueryProfilesCollectionArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  filter?: InputMaybe<ProfilesFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ProfilesOrderBy>>;
};

/** Boolean expression comparing fields on type "String" */
export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  ilike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  iregex?: InputMaybe<Scalars['String']['input']>;
  is?: InputMaybe<FilterIs>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression comparing fields on type "StringList" */
export type StringListFilter = {
  containedBy?: InputMaybe<Array<Scalars['String']['input']>>;
  contains?: InputMaybe<Array<Scalars['String']['input']>>;
  eq?: InputMaybe<Array<Scalars['String']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Boolean expression comparing fields on type "Time" */
export type TimeFilter = {
  eq?: InputMaybe<Scalars['Time']['input']>;
  gt?: InputMaybe<Scalars['Time']['input']>;
  gte?: InputMaybe<Scalars['Time']['input']>;
  in?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['Time']['input']>;
  lte?: InputMaybe<Scalars['Time']['input']>;
  neq?: InputMaybe<Scalars['Time']['input']>;
};

/** Boolean expression comparing fields on type "TimeList" */
export type TimeListFilter = {
  containedBy?: InputMaybe<Array<Scalars['Time']['input']>>;
  contains?: InputMaybe<Array<Scalars['Time']['input']>>;
  eq?: InputMaybe<Array<Scalars['Time']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['Time']['input']>>;
};

/** Boolean expression comparing fields on type "UUID" */
export type UuidFilter = {
  eq?: InputMaybe<Scalars['UUID']['input']>;
  in?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  neq?: InputMaybe<Scalars['UUID']['input']>;
};

/** Boolean expression comparing fields on type "UUIDList" */
export type UuidListFilter = {
  containedBy?: InputMaybe<Array<Scalars['UUID']['input']>>;
  contains?: InputMaybe<Array<Scalars['UUID']['input']>>;
  eq?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  overlaps?: InputMaybe<Array<Scalars['UUID']['input']>>;
};

export type Profiles = Node & {
  __typename?: 'profiles';
  avatar_url?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Datetime']['output']>;
  first_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  last_name?: Maybe<Scalars['String']['output']>;
  /** Globally Unique Record Identifier */
  nodeId: Scalars['ID']['output'];
  updated_at?: Maybe<Scalars['Datetime']['output']>;
};

export type ProfilesConnection = {
  __typename?: 'profilesConnection';
  edges: Array<ProfilesEdge>;
  pageInfo: PageInfo;
};

export type ProfilesDeleteResponse = {
  __typename?: 'profilesDeleteResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesEdge = {
  __typename?: 'profilesEdge';
  cursor: Scalars['String']['output'];
  node: Profiles;
};

export type ProfilesFilter = {
  /** Returns true only if all its inner filters are true, otherwise returns false */
  and?: InputMaybe<Array<ProfilesFilter>>;
  avatar_url?: InputMaybe<StringFilter>;
  created_at?: InputMaybe<DatetimeFilter>;
  first_name?: InputMaybe<StringFilter>;
  id?: InputMaybe<UuidFilter>;
  last_name?: InputMaybe<StringFilter>;
  nodeId?: InputMaybe<IdFilter>;
  /** Negates a filter */
  not?: InputMaybe<ProfilesFilter>;
  /** Returns true if at least one of its inner filters is true, otherwise returns false */
  or?: InputMaybe<Array<ProfilesFilter>>;
  updated_at?: InputMaybe<DatetimeFilter>;
};

export type ProfilesInsertInput = {
  avatar_url?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type ProfilesInsertResponse = {
  __typename?: 'profilesInsertResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesOrderBy = {
  avatar_url?: InputMaybe<OrderByDirection>;
  created_at?: InputMaybe<OrderByDirection>;
  first_name?: InputMaybe<OrderByDirection>;
  id?: InputMaybe<OrderByDirection>;
  last_name?: InputMaybe<OrderByDirection>;
  updated_at?: InputMaybe<OrderByDirection>;
};

export type ProfilesUpdateInput = {
  avatar_url?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['Datetime']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['Datetime']['input']>;
};

export type ProfilesUpdateResponse = {
  __typename?: 'profilesUpdateResponse';
  /** Count of the records impacted by the mutation */
  affectedCount: Scalars['Int']['output'];
  /** Array of records impacted by the mutation */
  records: Array<Profiles>;
};

export type ProfilesFragmentFragment = { __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null };

export type PageInfoFragmentFragment = { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null };

export type GetProfilesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetProfilesQuery = { __typename?: 'Query', profilesCollection?: { __typename?: 'profilesConnection', edges: Array<{ __typename?: 'profilesEdge', node: { __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };

export type GetProfileByIdQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type GetProfileByIdQuery = { __typename?: 'Query', profilesCollection?: { __typename?: 'profilesConnection', edges: Array<{ __typename?: 'profilesEdge', node: { __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null } }> } | null };

export type GetCurrentUserProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserProfileQuery = { __typename?: 'Query', profilesCollection?: { __typename?: 'profilesConnection', edges: Array<{ __typename?: 'profilesEdge', node: { __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null } }> } | null };

export type InsertProfileMutationVariables = Exact<{
  input: ProfilesInsertInput;
}>;


export type InsertProfileMutation = { __typename?: 'Mutation', insertIntoprofilesCollection?: { __typename?: 'profilesInsertResponse', records: Array<{ __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null }> } | null };

export type UpdateProfileMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  input: ProfilesUpdateInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateprofilesCollection: { __typename?: 'profilesUpdateResponse', records: Array<{ __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null }> } };

export type DeleteProfileMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type DeleteProfileMutation = { __typename?: 'Mutation', deleteFromprofilesCollection: { __typename?: 'profilesDeleteResponse', records: Array<{ __typename?: 'profiles', id: string }> } };

export type SearchProfilesQueryVariables = Exact<{
  searchTerm: Scalars['String']['input'];
}>;


export type SearchProfilesQuery = { __typename?: 'Query', profilesCollection?: { __typename?: 'profilesConnection', edges: Array<{ __typename?: 'profilesEdge', node: { __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null } }> } | null };

export type GetProfilesPaginatedQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type GetProfilesPaginatedQuery = { __typename?: 'Query', profilesCollection?: { __typename?: 'profilesConnection', edges: Array<{ __typename?: 'profilesEdge', cursor: string, node: { __typename?: 'profiles', id: string, avatar_url?: string | null, first_name?: string | null, last_name?: string | null, created_at?: string | null, updated_at?: string | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } | null };
