import { prisma } from '@/lib/db';
import { localDate } from './time';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  totalXp: number;
  rank: number;
  isCurrentUser: boolean;
  isSeed: boolean;
}

export interface LeaderboardResponse {
  topUsers: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserRank: number;
  totalParticipants: number;
}

export async function getLeaderboard(currentUserId?: string): Promise<LeaderboardResponse> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      photoUrl: true,
      totalXp: true,
      isSeed: true,
      driftPerDay: true,
      createdAt: true,
      lastKnownRank: true,
      timeZone: true,
    },
    orderBy: [
      { totalXp: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  const now = new Date();

  // Apply lazy drift to seeds
  const rankedUsers = users.map((u) => {
    let effectiveXp = u.totalXp;
    if (u.isSeed && u.driftPerDay > 0) {
      const elapsedDays = Math.max(0, (now.getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      effectiveXp = Math.round(u.totalXp + elapsedDays * u.driftPerDay);
    }
    return {
      ...u,
      effectiveXp,
    };
  });

  // Sort again by effective XP desc, createdAt asc
  rankedUsers.sort((a, b) => {
    if (b.effectiveXp !== a.effectiveXp) {
      return b.effectiveXp - a.effectiveXp;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  let currentUserRank = 0;
  let currentUserOvertaker: { id: string; name: string } | null = null;
  const currentUser = currentUserId ? rankedUsers.find((u) => u.id === currentUserId) : null;

  const entries: LeaderboardEntry[] = rankedUsers.map((u, index) => {
    const rank = index + 1;
    const isCurrentUser = u.id === currentUserId;
    if (isCurrentUser) {
      currentUserRank = rank;
      // Check if rank worsened compared to lastKnownRank
      if (u.lastKnownRank && rank > u.lastKnownRank) {
        // The user who passed them is right ahead of them
        const overtaker = rankedUsers[index - 1];
        if (overtaker && overtaker.id !== u.id) {
          currentUserOvertaker = { id: overtaker.id, name: overtaker.displayName };
        }
      }
    }
    return {
      userId: u.id,
      displayName: u.displayName,
      photoUrl: u.photoUrl,
      totalXp: u.effectiveXp,
      rank,
      isCurrentUser,
      isSeed: u.isSeed,
    };
  });

  // If user dropped rank, create rank_change notification if not already done today
  if (currentUser && currentUserOvertaker && currentUserId) {
    const overtaker: { id: string; name: string } = currentUserOvertaker;
    const today = localDate(currentUser.timeZone, now);
    const dedupeKey = `rank:${overtaker.id}:${today}`;

    const existingNotif = await prisma.notification.findUnique({
      where: { userId_dedupeKey: { userId: currentUserId, dedupeKey } },
    });

    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId: currentUserId,
          type: 'rank_change',
          message: `${overtaker.name} just passed you on the leaderboard! Complete a lesson to catch up! 🔥`,
          dedupeKey,
        },
      });
    }

    // Update lastKnownRank
    await prisma.user.update({
      where: { id: currentUserId },
      data: { lastKnownRank: currentUserRank },
    });
  } else if (currentUser && (!currentUser.lastKnownRank || currentUser.lastKnownRank !== currentUserRank)) {
    await prisma.user.update({
      where: { id: currentUserId },
      data: { lastKnownRank: currentUserRank },
    });
  }

  const topUsers = entries.slice(0, 10);
  const currentUserEntry = entries.find((e) => e.isCurrentUser) ?? null;

  return {
    topUsers,
    currentUserEntry,
    currentUserRank,
    totalParticipants: entries.length,
  };
}
