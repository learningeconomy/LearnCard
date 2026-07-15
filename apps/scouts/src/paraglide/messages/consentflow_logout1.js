/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Logout1Inputs */

const en_consentflow_logout1 = /** @type {(inputs: Consentflow_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logout`)
};

const es_consentflow_logout1 = /** @type {(inputs: Consentflow_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar Sesión`)
};

const fr_consentflow_logout1 = /** @type {(inputs: Consentflow_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion`)
};

const ar_consentflow_logout1 = /** @type {(inputs: Consentflow_Logout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الخروج`)
};

/**
* | output |
* | --- |
* | "Logout" |
*
* @param {Consentflow_Logout1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_logout1 = /** @type {((inputs?: Consentflow_Logout1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Logout1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_logout1(inputs)
	if (locale === "es") return es_consentflow_logout1(inputs)
	if (locale === "fr") return fr_consentflow_logout1(inputs)
	return ar_consentflow_logout1(inputs)
});
export { consentflow_logout1 as "consentFlow.logout" }