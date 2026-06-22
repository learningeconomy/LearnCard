/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, brand: NonNullable<unknown> }} Consentflow_Privacydata_Allowadddata4Inputs */

const en_consentflow_privacydata_allowadddata4 = /** @type {(inputs: Consentflow_Privacydata_Allowadddata4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Allow ${i?.name} to Add Data to Your ${i?.brand}`)
};

const es_consentflow_privacydata_allowadddata4 = /** @type {(inputs: Consentflow_Privacydata_Allowadddata4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Permitir que ${i?.name} añada datos a tu ${i?.brand}`)
};

const fr_consentflow_privacydata_allowadddata4 = /** @type {(inputs: Consentflow_Privacydata_Allowadddata4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Autoriser ${i?.name} à ajouter des données à votre ${i?.brand}`)
};

const ar_consentflow_privacydata_allowadddata4 = /** @type {(inputs: Consentflow_Privacydata_Allowadddata4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`السماح لـ ${i?.name} بإضافة بيانات إلى ${i?.brand} الخاص بك`)
};

/**
* | output |
* | --- |
* | "Allow {name} to Add Data to Your {brand}" |
*
* @param {Consentflow_Privacydata_Allowadddata4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacydata_allowadddata4 = /** @type {((inputs: Consentflow_Privacydata_Allowadddata4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacydata_Allowadddata4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacydata_allowadddata4(inputs)
	if (locale === "es") return es_consentflow_privacydata_allowadddata4(inputs)
	if (locale === "fr") return fr_consentflow_privacydata_allowadddata4(inputs)
	return ar_consentflow_privacydata_allowadddata4(inputs)
});
export { consentflow_privacydata_allowadddata4 as "consentFlow.privacyData.allowAddData" }