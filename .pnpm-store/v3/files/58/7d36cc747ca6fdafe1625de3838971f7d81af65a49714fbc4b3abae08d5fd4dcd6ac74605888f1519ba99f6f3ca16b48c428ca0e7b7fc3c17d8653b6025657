import type { bindDispatchUIEvent } from '../event';
import type * as userEventApi from './api';
import { setupMain, setupSub } from './setup';
import { Config, inputDeviceState } from './config';
import * as directApi from './directApi';
export type { inputDeviceState };
export { Config };
export declare type UserEventApi = typeof userEventApi;
export declare type Instance = UserEventApi & {
    [Config]: Config;
    dispatchUIEvent: ReturnType<typeof bindDispatchUIEvent>;
};
export declare type UserEvent = {
    readonly setup: (...args: Parameters<typeof setupSub>) => UserEvent;
} & {
    readonly [k in keyof UserEventApi]: (...args: Parameters<UserEventApi[k]>) => ReturnType<UserEventApi[k]>;
};
export declare const userEvent: {
    readonly setup: typeof setupMain;
    readonly clear: typeof directApi.clear;
    readonly click: typeof directApi.click;
    readonly copy: typeof directApi.copy;
    readonly cut: typeof directApi.cut;
    readonly dblClick: typeof directApi.dblClick;
    readonly deselectOptions: typeof directApi.deselectOptions;
    readonly hover: typeof directApi.hover;
    readonly keyboard: typeof directApi.keyboard;
    readonly pointer: typeof directApi.pointer;
    readonly paste: typeof directApi.paste;
    readonly selectOptions: typeof directApi.selectOptions;
    readonly tripleClick: typeof directApi.tripleClick;
    readonly type: typeof directApi.type;
    readonly unhover: typeof directApi.unhover;
    readonly upload: typeof directApi.upload;
    readonly tab: typeof directApi.tab;
};
