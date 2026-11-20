import ideas from '../../data/article-ideas.json';
import guides from './guides.json';

// Existing guides predate the candidate list. Managed articles also require explicit approval.
const statuses = new Map(ideas.map(({ id, status }) => [id, status]));
export const publishedGuides = guides.filter(({ id }) =>
  !statuses.has(id) || statuses.get(id) === 'published',
);
