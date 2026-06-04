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

const de_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung zu LearnCard hinzugefügt`)
};

const ar_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إضافة بيانات الاعتماد إلى LearnCard`)
};

const fr_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accréditation ajoutée à LearnCard`)
};

const ko_toasts_credential_addedtolearncard3 = /** @type {(inputs: Toasts_Credential_Addedtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명이 LearnCard에 추가됨`)
};

/**
* | output |
* | --- |
* | "Credential added to LearnCard" |
*
* @param {Toasts_Credential_Addedtolearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_credential_addedtolearncard3 = /** @type {((inputs?: Toasts_Credential_Addedtolearncard3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Credential_Addedtolearncard3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_credential_addedtolearncard3(inputs)
	if (locale === "es") return es_toasts_credential_addedtolearncard3(inputs)
	if (locale === "de") return de_toasts_credential_addedtolearncard3(inputs)
	if (locale === "ar") return ar_toasts_credential_addedtolearncard3(inputs)
	if (locale === "fr") return fr_toasts_credential_addedtolearncard3(inputs)
	return ko_toasts_credential_addedtolearncard3(inputs)
});
export { toasts_credential_addedtolearncard3 as "toasts.credential.addedToLearnCard" }