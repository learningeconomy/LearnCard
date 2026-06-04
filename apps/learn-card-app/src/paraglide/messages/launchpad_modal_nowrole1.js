/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ role: NonNullable<unknown> }} Launchpad_Modal_Nowrole1Inputs */

const en_launchpad_modal_nowrole1 = /** @type {(inputs: Launchpad_Modal_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`You are now a ${i?.role}.`)
};

const es_launchpad_modal_nowrole1 = /** @type {(inputs: Launchpad_Modal_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ahora eres ${i?.role}.`)
};

const de_launchpad_modal_nowrole1 = /** @type {(inputs: Launchpad_Modal_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Du bist jetzt ${i?.role}.`)
};

const ar_launchpad_modal_nowrole1 = /** @type {(inputs: Launchpad_Modal_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنت الآن ${i?.role}.`)
};

const fr_launchpad_modal_nowrole1 = /** @type {(inputs: Launchpad_Modal_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous êtes maintenant ${i?.role}.`)
};

const ko_launchpad_modal_nowrole1 = /** @type {(inputs: Launchpad_Modal_Nowrole1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`이제 ${i?.role}입니다.`)
};

/**
* | output |
* | --- |
* | "You are now a {role}." |
*
* @param {Launchpad_Modal_Nowrole1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_nowrole1 = /** @type {((inputs: Launchpad_Modal_Nowrole1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Nowrole1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_nowrole1(inputs)
	if (locale === "es") return es_launchpad_modal_nowrole1(inputs)
	if (locale === "de") return de_launchpad_modal_nowrole1(inputs)
	if (locale === "ar") return ar_launchpad_modal_nowrole1(inputs)
	if (locale === "fr") return fr_launchpad_modal_nowrole1(inputs)
	return ko_launchpad_modal_nowrole1(inputs)
});
export { launchpad_modal_nowrole1 as "launchpad.modal.nowRole" }