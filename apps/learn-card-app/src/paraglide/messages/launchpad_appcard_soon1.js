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

const fr_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bientôt`)
};

const ar_launchpad_appcard_soon1 = /** @type {(inputs: Launchpad_Appcard_Soon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً`)
};

/**
* | output |
* | --- |
* | "Soon" |
*
* @param {Launchpad_Appcard_Soon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_soon1 = /** @type {((inputs?: Launchpad_Appcard_Soon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Soon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_soon1(inputs)
	if (locale === "es") return es_launchpad_appcard_soon1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_soon1(inputs)
	return ar_launchpad_appcard_soon1(inputs)
});
export { launchpad_appcard_soon1 as "launchpad.appCard.soon" }