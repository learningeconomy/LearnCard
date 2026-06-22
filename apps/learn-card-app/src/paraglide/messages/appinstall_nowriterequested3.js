/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Nowriterequested3Inputs */

const en_appinstall_nowriterequested3 = /** @type {(inputs: Appinstall_Nowriterequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No write permissions requested`)
};

const es_appinstall_nowriterequested3 = /** @type {(inputs: Appinstall_Nowriterequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se solicitan permisos de escritura`)
};

const fr_appinstall_nowriterequested3 = /** @type {(inputs: Appinstall_Nowriterequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorisation d'écriture demandée`)
};

const ar_appinstall_nowriterequested3 = /** @type {(inputs: Appinstall_Nowriterequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يُطلب أي أذونات كتابة`)
};

/**
* | output |
* | --- |
* | "No write permissions requested" |
*
* @param {Appinstall_Nowriterequested3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_nowriterequested3 = /** @type {((inputs?: Appinstall_Nowriterequested3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Nowriterequested3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_nowriterequested3(inputs)
	if (locale === "es") return es_appinstall_nowriterequested3(inputs)
	if (locale === "fr") return fr_appinstall_nowriterequested3(inputs)
	return ar_appinstall_nowriterequested3(inputs)
});
export { appinstall_nowriterequested3 as "appInstall.noWriteRequested" }