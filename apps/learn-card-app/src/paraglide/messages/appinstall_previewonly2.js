/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Previewonly2Inputs */

const en_appinstall_previewonly2 = /** @type {(inputs: Appinstall_Previewonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Only`)
};

const es_appinstall_previewonly2 = /** @type {(inputs: Appinstall_Previewonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo vista previa`)
};

const fr_appinstall_previewonly2 = /** @type {(inputs: Appinstall_Previewonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu uniquement`)
};

const ar_appinstall_previewonly2 = /** @type {(inputs: Appinstall_Previewonly2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة فقط`)
};

/**
* | output |
* | --- |
* | "Preview Only" |
*
* @param {Appinstall_Previewonly2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_previewonly2 = /** @type {((inputs?: Appinstall_Previewonly2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Previewonly2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_previewonly2(inputs)
	if (locale === "es") return es_appinstall_previewonly2(inputs)
	if (locale === "fr") return fr_appinstall_previewonly2(inputs)
	return ar_appinstall_previewonly2(inputs)
});
export { appinstall_previewonly2 as "appInstall.previewOnly" }