import { z } from 'zod'

export const DiscoveryOptions = z.object({
    "allowed-hostnames": z.array(z.string()).optional(),
    "disallowed-hostnames": z.array(z.string()).optional(),
    "request-headers": z.record(z.string(),z.string()),
    "authorization": z.object({
        username: z.string().optional(),
        password: z.string().optional()
    }).optional(),
    "disable-cache": z.boolean().optional(),
    "cookies": z.string().optional(),
    "device-pixel-ratio": z.string().optional().transform((v) => Number(v)),
    "user-agent": z.string().optional(),
    "network-idle-timeout": z.number().optional(),
    "concurrency": z.number().optional().transform((v)=>Number(v))
})

export const PercySnapshot = z.object({
    // required
    name: z.string(),
    url: z.string(),
    domSnapshot: z.string(),
    // optional
    environmentInfo: z.array(z.string()).optional(),
    clientInfo: z.string().optional(),
    widths: z.array(z.number()).optional(),
    minHeight: z.number().optional(),
    enableJavaScript: z.boolean().optional(),
    requestHeaders: z.record(z.string(),z.string()).optional()
})

export const SnapshotOptions = z.object({
    "widths": z.array(z.number().or(z.string())).max(10).default([375, 1280]).transform((v)=>v.map((i)=>Number(i))),
    "min-height": z.string().or(z.number()).default("1024").transform((v)=>Number(v)),
    "percy-css": z.string().optional(),
    "scope": z.string().optional(),
    "enable-javascript": z.boolean().default(false)
})

export const PercyConfig = z.object({
    version: z.literal("2").default("2"),
    percy:z.object({
        token:z.string()
    }),
    snapshot: SnapshotOptions,
    discovery: DiscoveryOptions
})

