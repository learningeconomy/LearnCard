import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const controllerSource = readFileSync(
    resolve(process.cwd(), 'ios/App/App/MyViewController.swift'),
    'utf8'
);

describe('iOS shake responder contract', () => {
    it('forwards a recognized shake when motion begins, not after it ends', () => {
        expect(controllerSource).toMatch(
            /override func motionBegan[\s\S]*?motion == \.motionShake[\s\S]*?handleShakeGesture\(\)[\s\S]*?super\.motionBegan/
        );
        expect(controllerSource).not.toMatch(
            /override func motionEnded[\s\S]*?handleShakeGesture\(\)/
        );
    });
});
