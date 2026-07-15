/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Selectrecipient4Inputs */

const en_boostcms_selectrecipient4 = /** @type {(inputs: Boostcms_Selectrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Recipient`)
};

const es_boostcms_selectrecipient4 = /** @type {(inputs: Boostcms_Selectrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Destinatario`)
};

const fr_boostcms_selectrecipient4 = /** @type {(inputs: Boostcms_Selectrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le destinataire`)
};

const ar_boostcms_selectrecipient4 = /** @type {(inputs: Boostcms_Selectrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر المستلم`)
};

/**
* | output |
* | --- |
* | "Select Recipient" |
*
* @param {Boostcms_Selectrecipient4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_selectrecipient4 = /** @type {((inputs?: Boostcms_Selectrecipient4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Selectrecipient4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_selectrecipient4(inputs)
	if (locale === "es") return es_boostcms_selectrecipient4(inputs)
	if (locale === "fr") return fr_boostcms_selectrecipient4(inputs)
	return ar_boostcms_selectrecipient4(inputs)
});
export { boostcms_selectrecipient4 as "boostCMS.selectRecipient" }