/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ role: NonNullable<unknown> }} Toasts_Launchpad_Nowrole1Inputs */

const en_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`You're now a ${i?.role}.`)
};

const es_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ahora eres ${i?.role}.`)
};

const de_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Du bist jetzt ${i?.role}.`)
};

const ar_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنت الآن ${i?.role}.`)
};

const fr_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous êtes maintenant ${i?.role}.`)
};

const ko_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`이제 ${i?.role}입니다.`)
};

/**
* | output |
* | --- |
* | "You're now a {role}." |
*
* @param {Toasts_Launchpad_Nowrole1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_launchpad_nowrole1 = /** @type {((inputs: Toasts_Launchpad_Nowrole1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Launchpad_Nowrole1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_launchpad_nowrole1(inputs)
	if (locale === "es") return es_toasts_launchpad_nowrole1(inputs)
	if (locale === "de") return de_toasts_launchpad_nowrole1(inputs)
	if (locale === "ar") return ar_toasts_launchpad_nowrole1(inputs)
	if (locale === "fr") return fr_toasts_launchpad_nowrole1(inputs)
	return ko_toasts_launchpad_nowrole1(inputs)
});
export { toasts_launchpad_nowrole1 as "toasts.launchpad.nowRole" }