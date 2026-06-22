/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Partnerportal_Label2Inputs */

const en_admintools_partnerportal_label2 = /** @type {(inputs: Admintools_Partnerportal_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Portal`)
};

const es_admintools_partnerportal_label2 = /** @type {(inputs: Admintools_Partnerportal_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portal de socios`)
};

const fr_admintools_partnerportal_label2 = /** @type {(inputs: Admintools_Partnerportal_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portail partenaires`)
};

const ar_admintools_partnerportal_label2 = /** @type {(inputs: Admintools_Partnerportal_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بوابة الشركاء`)
};

/**
* | output |
* | --- |
* | "Partner Portal" |
*
* @param {Admintools_Partnerportal_Label2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_partnerportal_label2 = /** @type {((inputs?: Admintools_Partnerportal_Label2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Partnerportal_Label2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_partnerportal_label2(inputs)
	if (locale === "es") return es_admintools_partnerportal_label2(inputs)
	if (locale === "fr") return fr_admintools_partnerportal_label2(inputs)
	return ar_admintools_partnerportal_label2(inputs)
});
export { admintools_partnerportal_label2 as "adminTools.partnerPortal.label" }