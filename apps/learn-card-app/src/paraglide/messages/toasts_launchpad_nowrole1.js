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

const fr_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous êtes maintenant ${i?.role}.`)
};

const ar_toasts_launchpad_nowrole1 = /** @type {(inputs: Toasts_Launchpad_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنت الآن ${i?.role}.`)
};

/**
* | output |
* | --- |
* | "You're now a {role}." |
*
* @param {Toasts_Launchpad_Nowrole1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_launchpad_nowrole1 = /** @type {((inputs: Toasts_Launchpad_Nowrole1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Launchpad_Nowrole1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_launchpad_nowrole1(inputs)
	if (locale === "es") return es_toasts_launchpad_nowrole1(inputs)
	if (locale === "fr") return fr_toasts_launchpad_nowrole1(inputs)
	return ar_toasts_launchpad_nowrole1(inputs)
});
export { toasts_launchpad_nowrole1 as "toasts.launchpad.nowRole" }