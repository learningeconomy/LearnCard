/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Editaccess2Inputs */

const en_consentflow_editaccess2 = /** @type {(inputs: Consentflow_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Access`)
};

const es_consentflow_editaccess2 = /** @type {(inputs: Consentflow_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Acceso`)
};

const fr_consentflow_editaccess2 = /** @type {(inputs: Consentflow_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier l'accès`)
};

const ar_consentflow_editaccess2 = /** @type {(inputs: Consentflow_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الوصول`)
};

/**
* | output |
* | --- |
* | "Edit Access" |
*
* @param {Consentflow_Editaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_editaccess2 = /** @type {((inputs?: Consentflow_Editaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Editaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_editaccess2(inputs)
	if (locale === "es") return es_consentflow_editaccess2(inputs)
	if (locale === "fr") return fr_consentflow_editaccess2(inputs)
	return ar_consentflow_editaccess2(inputs)
});
export { consentflow_editaccess2 as "consentFlow.editAccess" }