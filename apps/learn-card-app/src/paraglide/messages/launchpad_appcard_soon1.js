/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Appcard_Soon1Inputs */

const en_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soon`)
};

const es_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Próximamente`)
};

const de_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bald`)
};

const ar_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً`)
};

const fr_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bientôt`)
};

const ko_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`곧`)
};

/**
* | output |
* | --- |
* | "Soon" |
*
* @param {Launchpad_Appcard_Soon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_soon1 = /** @type {((inputs?: Launchpad_Appcard_Soon1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Soon1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_soon1(inputs)
	if (locale === "es") return es_launchpad_appcard_soon1(inputs)
	if (locale === "de") return de_launchpad_appcard_soon1(inputs)
	if (locale === "ar") return ar_launchpad_appcard_soon1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_soon1(inputs)
	return ko_launchpad_appcard_soon1(inputs)
});
export { launchpad_appcard_soon1 as "launchpad.appCard.soon" }