/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Appcard_Loading1Inputs */

const en_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const de_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laden...`)
};

const ar_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحميل...`)
};

const fr_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ko_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로딩 중...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Launchpad_Appcard_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_loading1 = /** @type {((inputs?: Launchpad_Appcard_Loading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Loading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_loading1(inputs)
	if (locale === "es") return es_launchpad_appcard_loading1(inputs)
	if (locale === "de") return de_launchpad_appcard_loading1(inputs)
	if (locale === "ar") return ar_launchpad_appcard_loading1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_loading1(inputs)
	return ko_launchpad_appcard_loading1(inputs)
});
export { launchpad_appcard_loading1 as "launchpad.appCard.loading" }