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

const fr_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_launchpad_appcard_loading1 = /** @type {(inputs: Launchpad_Appcard_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحميل...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Launchpad_Appcard_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_loading1 = /** @type {((inputs?: Launchpad_Appcard_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_loading1(inputs)
	if (locale === "es") return es_launchpad_appcard_loading1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_loading1(inputs)
	return ar_launchpad_appcard_loading1(inputs)
});
export { launchpad_appcard_loading1 as "launchpad.appCard.loading" }