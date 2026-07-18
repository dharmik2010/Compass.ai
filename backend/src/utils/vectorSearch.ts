import { Destination } from '../models/Destination';
import { isDbConnected, mockDestinations, seedMockDestinations } from './mockDb';

export const performVectorSearch = async (
  queryTags: string[],
  maxCost: number,
  limit: number = 3
): Promise<any[]> => {
  seedMockDestinations();

  let candidates: any[] = [];
  if (isDbConnected()) {
    candidates = await Destination.find({});
  } else {
    candidates = mockDestinations;
  }

  if (maxCost > 0) {
    candidates = candidates.filter(dest => dest.estimatedCost <= maxCost);
  }

  const scoredCandidates = candidates.map(dest => {
    // Direct name or country keyword matches override similarities for accuracy
    let directMatch = 0;
    if (queryTags.some(qt => qt.toLowerCase() === dest.name.toLowerCase() || qt.toLowerCase() === dest.country.toLowerCase())) {
      directMatch = 1;
    }

    const matchingTags = dest.tags.filter((t: string) => 
      queryTags.some(qt => qt.toLowerCase() === t.toLowerCase())
    );
    const tagScore = dest.tags.length > 0 ? matchingTags.length / Math.max(queryTags.length, 1) : 0;

    const queryVector = [0, 0, 0, 0, 0, 0, 0, 0];
    queryTags.forEach(tag => {
      const idx = tag.length % 8;
      queryVector[idx] += 0.25;
    });
    
    const qMag = Math.sqrt(queryVector.reduce((sum, v) => sum + v * v, 0)) || 1;
    const normQueryVector = queryVector.map(v => v / qMag);

    const destEmbed = dest.vectorEmbeddings && dest.vectorEmbeddings.length === 8 
      ? dest.vectorEmbeddings 
      : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const dMag = Math.sqrt(destEmbed.reduce((sum: number, v: number) => sum + v * v, 0)) || 1;
    const normDestVector = destEmbed.map((v: number) => v / dMag);

    const cosineSimilarity = normQueryVector.reduce((sum, v, idx) => sum + v * normDestVector[idx], 0);

    // Blended score (70% tag overlap, 30% vector cosine similarity)
    const score = directMatch === 1 ? 1 : (tagScore * 0.7) + (cosineSimilarity * 0.3);

    return {
      ...JSON.parse(JSON.stringify(dest)),
      matchScore: Math.round(score * 100)
    };
  });

  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  console.log(`\n🔍  [VECTOR SEARCH] Evaluated ${scoredCandidates.length} destinations.`);
  scoredCandidates.slice(0, limit).forEach(c => {
    console.log(`   📍 Destination: ${c.name} (${c.country}) | Vector Cosine Similarity Score: ${c.matchScore}%`);
  });
  console.log();

  return scoredCandidates.slice(0, limit);
};
