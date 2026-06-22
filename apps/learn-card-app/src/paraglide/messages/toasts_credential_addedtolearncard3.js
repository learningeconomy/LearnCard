/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Credential_Addedtolearncard3Inputs */

const en_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential added to LearnCard`)
};

const es_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial agregada a LearnCard`)
};

const fr_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accréditation ajoutée à LearnCard`)
};

const ar_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إضافة بيانات الاعتماد إلى LearnCard`)
};

/**
* | output |
* | --- |
* | "Credential added to LearnCard" |
*
* @param {Toasts_Credential_Addedtolearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_credential_addedtolearncard3 = /** @type {((inputs?: Toasts_Credential_Addedtolearncard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Credential_Addedtolearncard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_credential_addedtolearncard3(inputs)
	if (locale === "es") return es_toasts_credential_addedtolearncard3(inputs)
	if (locale === "fr") return fr_toasts_credential_addedtolearncard3(inputs)
	return ar_toasts_credential_addedtolearncard3(inputs)
});
export { toasts_credential_addedtolearncard3 as "toasts.credential.addedToLearnCard" }