// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { DisplayTypeEnum } from '../display-types';
import { buildLcTags, parseLcTags } from '../displayTags.helpers';

describe('parseLcTags', () => {
    it('returns an empty object for undefined / non-array input', () => {
        expect(parseLcTags(undefined)).toEqual({});
        expect(parseLcTags(null as unknown as string[])).toEqual({});
        expect(parseLcTags('lc:subtype:Event' as unknown as string[])).toEqual({});
    });

    it('parses each recognized key', () => {
        expect(
            parseLcTags([
                'lc:subtype:Trailblazer',
                'lc:displayType:certificate',
                'lc:bgColor:353E64',
                'lc:bgImage:https://example.com/bg.png',
                'lc:idBackgroundImage:https://example.com/id-bg.png',
                'lc:idIssuerThumbnail:https://example.com/issuer.png',
                'lc:idDimBackgroundImage:true',
                'lc:accentColor:#FF0000',
            ])
        ).toEqual({
            subtype: 'Trailblazer',
            displayType: DisplayTypeEnum.Certificate,
            backgroundColor: '#353E64',
            backgroundImage: 'https://example.com/bg.png',
            idBackgroundImage: 'https://example.com/id-bg.png',
            idIssuerThumbnail: 'https://example.com/issuer.png',
            idDimBackgroundImage: true,
            accentColor: '#FF0000',
        });
    });

    it('ignores non-lc namespaces and unknown keys', () => {
        expect(parseLcTags(['ext:Trailblazer', 'skill:coding', 'lc:unknown:foo'])).toEqual({});
    });

    it('matches namespace and key case-insensitively but preserves value case', () => {
        expect(parseLcTags(['LC:SubType:CoolCat'])).toEqual({ subtype: 'CoolCat' });
    });

    it('preserves colons in values (only first two colons are structural)', () => {
        expect(parseLcTags(['lc:bgImage:https://a.com/x:y.png'])).toEqual({
            backgroundImage: 'https://a.com/x:y.png',
        });
    });

    it('ignores an invalid display type', () => {
        expect(parseLcTags(['lc:displayType:hologram'])).toEqual({});
    });

    it('accepts hex colors with or without a leading hash and normalizes to hash', () => {
        expect(parseLcTags(['lc:bgColor:fff'])).toEqual({ backgroundColor: '#fff' });
        expect(parseLcTags(['lc:bgColor:#AABBCC'])).toEqual({ backgroundColor: '#AABBCC' });
    });

    it('ignores invalid hex colors', () => {
        expect(parseLcTags(['lc:bgColor:notacolor'])).toEqual({});
        expect(parseLcTags(['lc:bgColor:12345'])).toEqual({});
    });

    it('ignores non-https display images', () => {
        expect(
            parseLcTags([
                'lc:bgImage:http://insecure.com/a.png',
                'lc:idBackgroundImage:not a url',
                'lc:idIssuerThumbnail:http://insecure.com/issuer.png',
            ])
        ).toEqual({});
    });

    it('ignores invalid ID background dimming values', () => {
        expect(parseLcTags(['lc:idDimBackgroundImage:yes'])).toEqual({});
    });

    it('ignores malformed tags and empty values', () => {
        expect(parseLcTags(['lc', 'lc:subtype', 'lc:subtype:', ''])).toEqual({});
    });

    it('lets later tags win for the same key', () => {
        expect(parseLcTags(['lc:subtype:First', 'lc:subtype:Second'])).toEqual({
            subtype: 'Second',
        });
    });
});

describe('buildLcTags', () => {
    it('emits only defined, valid hints', () => {
        expect(
            buildLcTags({
                subtype: 'Trailblazer',
                displayType: DisplayTypeEnum.Certificate,
                backgroundColor: '#353E64',
                backgroundImage: 'https://example.com/bg.png',
                accentColor: 'FF0000',
                idBackgroundImage: 'https://example.com/id-bg.png',
                idIssuerThumbnail: 'https://example.com/issuer.png',
                idDimBackgroundImage: true,
            })
        ).toEqual([
            'lc:subtype:Trailblazer',
            'lc:displayType:certificate',
            'lc:bgColor:353E64',
            'lc:bgImage:https://example.com/bg.png',
            'lc:idBackgroundImage:https://example.com/id-bg.png',
            'lc:idIssuerThumbnail:https://example.com/issuer.png',
            'lc:idDimBackgroundImage:true',
            'lc:accentColor:FF0000',
        ]);
    });

    it('emits colors without a leading hash', () => {
        expect(buildLcTags({ backgroundColor: '#abcdef' })).toEqual(['lc:bgColor:abcdef']);
    });

    it('skips invalid values', () => {
        expect(
            buildLcTags({
                backgroundColor: 'nope',
                backgroundImage: 'http://insecure.com/a.png',
                idBackgroundImage: 'not a url',
                idIssuerThumbnail: 'http://insecure.com/issuer.png',
            })
        ).toEqual([]);
    });

    it('round-trips through parseLcTags', () => {
        const hints = {
            subtype: 'CoolCat',
            displayType: DisplayTypeEnum.Badge,
            backgroundColor: '#123456',
            backgroundImage: 'https://cdn.example.com/a.png',
            accentColor: '#654321',
            idBackgroundImage: 'https://cdn.example.com/id.png',
            idIssuerThumbnail: 'https://cdn.example.com/issuer.png',
            idDimBackgroundImage: false,
        };
        expect(parseLcTags(buildLcTags(hints))).toEqual(hints);
    });
});
