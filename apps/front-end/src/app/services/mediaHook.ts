import { QueryKey, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addComment, fetchMedia, fetchMediaDetail, updateMediaDescription } from "./mediaServices";
import { AddCommentVariables, MediaDetail, UpdateDescriptionVariables, Comment, ApiResponse } from "./types";

export function useUpdateDescription(mediaId: string) {

    const queryClient = useQueryClient();
    const mediaQueryKey = ['media', mediaId] as const;
    
    return useMutation<
    MediaDetail,
    Error,
    UpdateDescriptionVariables
  >({
    mutationFn: updateMediaDescription,
    onSuccess: (updatedMedia) => {
      queryClient.setQueryData<MediaDetail>(mediaQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...updatedMedia,
          comments: oldData.comments 
        };
      });
    }
  });
}

export function useAddComment(mediaId: string) {
    const queryClient = useQueryClient();
    const mediaQueryKey = ['media', mediaId] as const;

    return useMutation<
        Comment,
        Error,
        AddCommentVariables
      >({
        mutationFn: addComment,
        onSuccess: (newCommentData) => {
          queryClient.setQueryData<MediaDetail>(mediaQueryKey, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              comments: [newCommentData, ...oldData.comments]
            };
          });
        }
      });
}

export function useMediaDetail(mediaId: string) {
    const mediaQueryKey = ['media', mediaId] as const;

    return useQuery<
    MediaDetail,
    Error,
    MediaDetail,
    typeof mediaQueryKey
  >({
    queryKey: mediaQueryKey,
    queryFn: () => fetchMediaDetail(mediaId),
    enabled: !!mediaId
  });
}

export function useMediaList(page: number, limit: number) {
    return useQuery<ApiResponse, Error, ApiResponse, QueryKey>({
        queryKey: ['media', page, limit],
        queryFn: fetchMedia,
      });
}