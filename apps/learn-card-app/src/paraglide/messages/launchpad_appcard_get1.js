/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Appcard_Get1Inputs */

const en_launchpad_appcard_get1 = /** @type {(inputs: Launchpad_Appcard_Get1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get`)
};

const es_launchpad_appcard_get1 = /** @type {(inputs: Launchpad_Appcard_Get1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener`)
};

const de_launchpad_appcard_get1 = /** @type {(inputs: Launchpad_Appcard_Get1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laden`)
};

const ar_launchpad_appcard_get1 = /** @type {(inputs: Launchpad_Appcard_Get1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول`)
};

const fr_launchpad_appcard_get1 = /** @type {(inputs: Launchpad_Appcard_Get1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir`)
};

const ko_launchpad_appcard_get1 = /** @type {(inputs: Launchpad_Appcard_Get1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설치`)
};

/**
* | output |
* | --- |
* | "Get" |
*
* @param {Launchpad_Appcard_Get1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_get1 = /** @type {((inputs?: Launchpad_Appcard_Get1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Get1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_get1(inputs)
	if (locale === "es") return es_launchpad_appcard_get1(inputs)
	if (locale === "de") return de_launchpad_appcard_get1(inputs)
	if (locale === "ar") return ar_launchpad_appcard_get1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_get1(inputs)
	return ko_launchpad_appcard_get1(inputs)
});
export { launchpad_appcard_get1 as "launchpad.appCard.get" }