import type { MetadataRoute } from 'next';
import { regrasRobots } from '@/lib/indexacao';

export default function robots(): MetadataRoute.Robots {
  return regrasRobots();
}
