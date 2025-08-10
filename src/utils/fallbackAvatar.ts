import avatar1 from '@assets/profile_avatars/thumbs-1754720467358.svg';
import avatar2 from '@assets/profile_avatars/thumbs-1754720470592.svg';
import avatar3 from '@assets/profile_avatars/thumbs-1754720474770.svg';
import avatar4 from '@assets/profile_avatars/thumbs-1754720480677.svg';

const avatarPool: string[] = [avatar1, avatar2, avatar3, avatar4];

function hashStringToIndex(input: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

export function getFallbackAvatar(input?: { uid?: string | null; email?: string | null; displayName?: string | null }): string {
  const seed = input?.uid || input?.email || input?.displayName || `${Date.now()}-${Math.random()}`;
  const index = hashStringToIndex(seed, avatarPool.length);
  return avatarPool[index];
}


