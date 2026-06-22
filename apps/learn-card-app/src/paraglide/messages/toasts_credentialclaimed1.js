/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Credentialclaimed1Inputs */

const en_toasts_credentialclaimed1 = /** @type {(inputs: Toasts_Credentialclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully claimed Credential!`)
};

const es_toasts_credentialclaimed1 = /** @type {(inputs: Toasts_Credentialclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial reclamada exitosamente!`)
};

const fr_toasts_credentialclaimed1 = /** @type {(inputs: Toasts_Credentialclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accréditation réclamée avec succès !`)
};

const ar_toasts_credentialclaimed1 = /** @type {(inputs: Toasts_Credentialclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم المطالبة ببيانات الاعتماد بنجاح!`)
};

/**
* | output |
* | --- |
* | "Successfully claimed Credential!" |
*
* @param {Toasts_Credentialclaimed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_credentialclaimed1 = /** @type {((inputs?: Toasts_Credentialclaimed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Credentialclaimed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_credentialclaimed1(inputs)
	if (locale === "es") return es_toasts_credentialclaimed1(inputs)
	if (locale === "fr") return fr_toasts_credentialclaimed1(inputs)
	return ar_toasts_credentialclaimed1(inputs)
});
export { toasts_credentialclaimed1 as "toasts.credentialClaimed" }