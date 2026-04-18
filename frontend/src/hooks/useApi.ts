import {
  useQuery, useMutation, useInfiniteQuery, useQueryClient,
  type UseQueryOptions, type InfiniteData,
} from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  userService, communityService, postService, groupService,
  eventService, challengeService, opportunityService, resourceService,
  leaderboardService, mentorService, messageService, searchService,
  onboardingService, nomadService,
} from '@/services/api.service';
import type {
  Post, Group, Event, Challenge, Opportunity, Resource,
  LeaderboardEntry, Mentor, Conversation, ChatMessage,
  Community, ChallengeSubmission,
} from '@/lib/types';

// ─── User / Me ────────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn:  () => userService.getMe().then((r) => r.data.data.user),
    staleTime: 5 * 60_000,
  });
}

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: queryKeys.notifications(page),
    queryFn:  () => userService.getNotifications(page).then((r) => r.data),
  });
}

// ─── Communities ──────────────────────────────────────────────────────────────
export function useCommunities() {
  return useQuery({
    queryKey: queryKeys.communities,
    queryFn:  () => communityService.list().then((r) => r.data.data.communities),
    staleTime: 10 * 60_000,
  });
}

export function useCommunity(slug: string) {
  return useQuery({
    queryKey: queryKeys.community(slug),
    queryFn:  () => communityService.get(slug).then((r) => r.data.data.community),
    enabled:  !!slug,
  });
}

export function useJoinCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => communityService.join(slug),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.communities }),
  });
}

export function useLeaveCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => communityService.leave(slug),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.communities }),
  });
}

// ─── Feed / Posts ─────────────────────────────────────────────────────────────
export function useFeed(params: { community?: string; type?: string; sort?: string; group_id?: number; page?: number }) {
  return useQuery({
    queryKey: queryKeys.feed(params),
    queryFn:  () => postService.feed(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn:  () => postService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => postService.create(data).then((r) => r.data.data.post),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) => postService.update(id, data),
    onSuccess:  (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: queryKeys.post(id) });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postService.like(id).then((r) => r.data.data),
    onSuccess:  (_r, id) => qc.invalidateQueries({ queryKey: queryKeys.post(id) }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, parent_id }: { id: number; content: string; parent_id?: number }) =>
      postService.addComment(id, content, parent_id).then((r) => r.data.data.comment),
    onSuccess: (_r, { id }) => qc.invalidateQueries({ queryKey: queryKeys.post(id) }),
  });
}

// ─── Groups ───────────────────────────────────────────────────────────────────
export function useGroups(params: { community?: string; search?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.groups(params),
    queryFn:  () => groupService.list(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: queryKeys.group(id),
    queryFn:  () => groupService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => groupService.create(data).then((r) => r.data.data.group),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => groupService.join(id).then((r) => r.data.data),
    onSuccess:  (_r, id) => qc.invalidateQueries({ queryKey: queryKeys.group(id) }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => groupService.leave(id),
    onSuccess:  (_r, id) => qc.invalidateQueries({ queryKey: queryKeys.group(id) }),
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────
export function useEvents(params: { community?: string; type?: string; status?: string; upcoming?: boolean; page?: number }) {
  return useQuery({
    queryKey: queryKeys.events(params),
    queryFn:  () => eventService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn:  () => eventService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => eventService.create(data).then((r) => r.data.data.event),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'going' | 'maybe' | 'not_going' }) =>
      eventService.rsvp(id, status).then((r) => r.data.data),
    onSuccess: (_r, { id }) => qc.invalidateQueries({ queryKey: queryKeys.event(id) }),
  });
}

// ─── Challenges ───────────────────────────────────────────────────────────────
export function useChallenges(params: { community?: string; type?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.challenges(params),
    queryFn:  () => challengeService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useChallenge(id: number) {
  return useQuery({
    queryKey: queryKeys.challenge(id),
    queryFn:  () => challengeService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useChallengeSubmissions(id: number, page = 1) {
  return useQuery({
    queryKey: queryKeys.challengeSubmissions(id, page),
    queryFn:  () => challengeService.submissions(id, page).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useSubmitChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      challengeService.submit(id, data).then((r) => r.data.data.submission),
    onSuccess: (_r, { id }) => qc.invalidateQueries({ queryKey: queryKeys.challenge(id) }),
  });
}

export function useVoteSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, challengeId }: { submissionId: number; challengeId: number }) =>
      challengeService.vote(submissionId).then((r) => r.data.data),
    onSuccess: (_r, { challengeId }) =>
      qc.invalidateQueries({ queryKey: ['challenge', challengeId, 'submissions'] }),
  });
}

// ─── Opportunities ────────────────────────────────────────────────────────────
export function useOpportunities(params: {
  community?: string; type?: string; location_type?: string;
  search?: string; saved?: boolean; page?: number;
}) {
  return useQuery({
    queryKey: queryKeys.opportunities(params),
    queryFn:  () => opportunityService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useOpportunity(id: number) {
  return useQuery({
    queryKey: queryKeys.opportunity(id),
    queryFn:  () => opportunityService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useApplyOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      opportunityService.apply(id, data).then((r) => r.data.data.application),
    onSuccess: (_r, { id }) => qc.invalidateQueries({ queryKey: queryKeys.opportunity(id) }),
  });
}

export function useSaveOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => opportunityService.save(id).then((r) => r.data.data),
    onSuccess: (_r, id) => qc.invalidateQueries({ queryKey: queryKeys.opportunity(id) }),
  });
}

// ─── Resources ────────────────────────────────────────────────────────────────
export function useResources(params: { community?: string; type?: string; search?: string; is_free?: boolean; page?: number }) {
  return useQuery({
    queryKey: queryKeys.resources(params),
    queryFn:  () => resourceService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: queryKeys.resource(id),
    queryFn:  () => resourceService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useRateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, review }: { id: number; rating: number; review?: string }) =>
      resourceService.rate(id, rating, review),
    onSuccess: (_r, { id }) => qc.invalidateQueries({ queryKey: queryKeys.resource(id) }),
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export function useLeaderboard(params: { period?: string; community?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.leaderboard(params),
    queryFn:  () => leaderboardService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useMyLeaderboardStats(period?: string) {
  return useQuery({
    queryKey: queryKeys.myLeaderboardStats(period),
    queryFn:  () => leaderboardService.myStats(period).then((r) => r.data.data),
  });
}

// ─── Mentors ──────────────────────────────────────────────────────────────────
export function useMentors(params: { community?: string; expertise?: string; available?: boolean; page?: number }) {
  return useQuery({
    queryKey: queryKeys.mentors(params),
    queryFn:  () => mentorService.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useMentor(id: number) {
  return useQuery({
    queryKey: queryKeys.mentor(id),
    queryFn:  () => mentorService.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });
}

export function useRequestMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { topic: string; message?: string; session_type?: string } }) =>
      mentorService.request(id, data),
    onSuccess: (_r, { id }) => qc.invalidateQueries({ queryKey: queryKeys.mentor(id) }),
  });
}

export function useMentorRequests(type?: 'incoming' | 'outgoing' | 'all') {
  return useQuery({
    queryKey: queryKeys.mentorRequests(type),
    queryFn:  () => mentorService.myRequests(type).then((r) => r.data),
  });
}

export function useUpdateMentorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => mentorService.updateRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentors', 'requests'] }),
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations(),
    queryFn:  () => messageService.conversations().then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn:  () => messageService.messages(conversationId).then((r) => r.data),
    enabled:  !!conversationId,
    refetchInterval: false,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
      messageService.send(conversationId, content).then((r) => r.data.data.message),
    onSuccess: (_r, { conversationId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      qc.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ user_id, message }: { user_id: number; message: string }) =>
      messageService.start(user_id, message).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────
export function useSearch(q: string, type = 'all', enabled = true) {
  return useQuery({
    queryKey: queryKeys.search({ q, type }),
    queryFn:  () => searchService.global(q, type).then((r) => r.data.data),
    enabled:  enabled && q.length >= 2,
    staleTime: 30_000,
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export function useProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.profile(username),
    queryFn:  () =>
      import('@/services/api.service').then((m) =>
        m.profileService.get(username).then((r) => r.data.data.user)
      ),
    enabled: !!username,
    staleTime: 60_000,
  });
}

// ─── Follow ───────────────────────────────────────────────────────────────────
export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.follow(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUnfollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.unfollow(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding'],
    queryFn:  () => onboardingService.status().then((r) => r.data.data),
  });
}

export function useSubmitOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onboardingService.submit,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: queryKeys.me });
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}
