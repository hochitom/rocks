/**
 * The Cloudflare Web Analytics site token, if visitor statistics are switched on: only in production
 * builds, and only when CLOUDFLARE_ANALYTICS_TOKEN is set. The layout adds the beacon and the privacy
 * section describes it only then.
 */
export const analyticsToken: string | undefined = import.meta.env.PROD
  ? process.env.CLOUDFLARE_ANALYTICS_TOKEN || undefined
  : undefined;
