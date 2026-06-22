/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs */

const en_developerportal_credentialbuilder_validationerrors_dateerror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date field error`)
};

const es_developerportal_credentialbuilder_validationerrors_dateerror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error en campo de fecha`)
};

const fr_developerportal_credentialbuilder_validationerrors_dateerror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur de champ de date`)
};

const ar_developerportal_credentialbuilder_validationerrors_dateerror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في حقل التاريخ`)
};

/**
* | output |
* | --- |
* | "Date field error" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_dateerror4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Dateerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_dateerror4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_dateerror4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_dateerror4(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_dateerror4(inputs)
});
export { developerportal_credentialbuilder_validationerrors_dateerror4 as "developerPortal.credentialBuilder.validationErrors.dateError" }