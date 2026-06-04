/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Updatedterms2Inputs */

const en_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have updated your terms.`)
};

const es_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has actualizado tus términos.`)
};

const de_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du hast deine Bedingungen aktualisiert.`)
};

const ar_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد قمت بتحديث شروطك.`)
};

const fr_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez mis à jour vos conditions.`)
};

const ko_consentflow_updatedterms2 = /** @type {(inputs: Consentflow_Updatedterms2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`약관을 업데이트했습니다.`)
};

/**
* | output |
* | --- |
* | "You have updated your terms." |
*
* @param {Consentflow_Updatedterms2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_updatedterms2 = /** @type {((inputs?: Consentflow_Updatedterms2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Updatedterms2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_updatedterms2(inputs)
	if (locale === "es") return es_consentflow_updatedterms2(inputs)
	if (locale === "de") return de_consentflow_updatedterms2(inputs)
	if (locale === "ar") return ar_consentflow_updatedterms2(inputs)
	if (locale === "fr") return fr_consentflow_updatedterms2(inputs)
	return ko_consentflow_updatedterms2(inputs)
});
export { consentflow_updatedterms2 as "consentFlow.updatedTerms" }