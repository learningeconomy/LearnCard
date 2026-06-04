/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_TitleInputs */

const en_membership_title = /** @type {(inputs: Membership_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

const es_membership_title = /** @type {(inputs: Membership_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membresía`)
};

const de_membership_title = /** @type {(inputs: Membership_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mitgliedschaft`)
};

const ar_membership_title = /** @type {(inputs: Membership_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العضوية`)
};

const fr_membership_title = /** @type {(inputs: Membership_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adhésion`)
};

const ko_membership_title = /** @type {(inputs: Membership_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`멤버십`)
};

/**
* | output |
* | --- |
* | "Membership" |
*
* @param {Membership_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_title = /** @type {((inputs?: Membership_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_title(inputs)
	if (locale === "es") return es_membership_title(inputs)
	if (locale === "de") return de_membership_title(inputs)
	if (locale === "ar") return ar_membership_title(inputs)
	if (locale === "fr") return fr_membership_title(inputs)
	return ko_membership_title(inputs)
});
export { membership_title as "membership.title" }