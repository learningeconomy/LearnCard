/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Delcredsq3Inputs */

const en_consentflow_delcredsq3 = /** @type {(inputs: Consentflow_Delcredsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Do you want to delete all credentials associated with this contract?`)
};

const es_consentflow_delcredsq3 = /** @type {(inputs: Consentflow_Delcredsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Quieres eliminar todas las credenciales asociadas con este contrato?`)
};

const fr_consentflow_delcredsq3 = /** @type {(inputs: Consentflow_Delcredsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous supprimer tous les justificatifs associés à ce contrat ?`)
};

const ar_consentflow_delcredsq3 = /** @type {(inputs: Consentflow_Delcredsq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Do you want to delete all credentials associated with this contract?`)
};

/**
* | output |
* | --- |
* | "Do you want to delete all credentials associated with this contract?" |
*
* @param {Consentflow_Delcredsq3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_delcredsq3 = /** @type {((inputs?: Consentflow_Delcredsq3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Delcredsq3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_delcredsq3(inputs)
	if (locale === "es") return es_consentflow_delcredsq3(inputs)
	if (locale === "fr") return fr_consentflow_delcredsq3(inputs)
	return ar_consentflow_delcredsq3(inputs)
});
export { consentflow_delcredsq3 as "consentFlow.delCredsQ" }