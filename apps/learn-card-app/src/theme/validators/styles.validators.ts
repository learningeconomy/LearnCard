import { z } from 'zod';

export const WalletCardStylesSchema = z
    .object({
        iconStyles: z.string().describe('Utility classes for wallet card icon'),
        cardStyles: z.string().describe('Utility classes for wallet card container'),
    })
    .describe('Wallet Card Styles');
export type WalletCardStyles = z.infer<typeof WalletCardStylesSchema>;

export const LaunchPadStylesSchema = z
    .object({
        textStyles: z.string().describe('Utility classes for LaunchPad text'),
        iconStyles: z.string().describe('Utility classes for LaunchPad icons'),
        indicatorStyles: z.string().optional().describe('Optional utility classes for indicators'),
    })
    .describe('LaunchPad Styles');
export type LaunchPadStyles = z.infer<typeof LaunchPadStylesSchema>;

export const DefaultsStylesSchema = z
    .object({
        tabs: z.object({ borderRadius: z.string().describe('Utility classes for tabs') }),
    })
    .describe('Default styles overrides');
export type DefaultsStyles = z.infer<typeof DefaultsStylesSchema>;

export const ThemeStylesSchema = z
    .object({
        wallet: WalletCardStylesSchema.describe('Wallet styles overrides'),
        launchPad: LaunchPadStylesSchema.describe('LaunchPad styles overrides'),
        defaults: DefaultsStylesSchema.describe('Default styles overrides'),
    })
    .describe('Theme Style Tweaks');
export type ThemeStyles = z.infer<typeof ThemeStylesSchema>;
