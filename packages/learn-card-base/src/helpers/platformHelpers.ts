import { Capacitor } from '@capacitor/core'

export enum PlatformEnum {
  Web = 'web',
  IOS = 'ios',
  Android = 'android',
}

export const isPlatformWeb = () => Capacitor.getPlatform() === PlatformEnum.Web
export const isPlatformIOS = () => Capacitor.getPlatform() === PlatformEnum.IOS
export const isPlatformAndroid = () => Capacitor.getPlatform() === PlatformEnum.Android
