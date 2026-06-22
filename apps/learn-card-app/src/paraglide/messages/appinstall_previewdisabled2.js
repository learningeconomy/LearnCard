/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Previewdisabled2Inputs */

const en_appinstall_previewdisabled2 = /** @type {(inputs: Appinstall_Previewdisabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install is disabled in preview mode`)
};

const es_appinstall_previewdisabled2 = /** @type {(inputs: Appinstall_Previewdisabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La instalación está deshabilitada en el modo de vista previa`)
};

const fr_appinstall_previewdisabled2 = /** @type {(inputs: Appinstall_Previewdisabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'installation est désactivée en mode aperçu`)
};

const ar_appinstall_previewdisabled2 = /** @type {(inputs: Appinstall_Previewdisabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التثبيت معطّل في وضع المعاينة`)
};

/**
* | output |
* | --- |
* | "Install is disabled in preview mode" |
*
* @param {Appinstall_Previewdisabled2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_previewdisabled2 = /** @type {((inputs?: Appinstall_Previewdisabled2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Previewdisabled2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_previewdisabled2(inputs)
	if (locale === "es") return es_appinstall_previewdisabled2(inputs)
	if (locale === "fr") return fr_appinstall_previewdisabled2(inputs)
	return ar_appinstall_previewdisabled2(inputs)
});
export { appinstall_previewdisabled2 as "appInstall.previewDisabled" }