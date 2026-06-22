/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Partnerportal_Description2Inputs */

const en_admintools_partnerportal_description2 = /** @type {(inputs: Admintools_Partnerportal_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish and manage apps in the App Store.`)
};

const es_admintools_partnerportal_description2 = /** @type {(inputs: Admintools_Partnerportal_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publica y gestiona aplicaciones en la App Store.`)
};

const fr_admintools_partnerportal_description2 = /** @type {(inputs: Admintools_Partnerportal_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publiez et gérez des applications dans l'App Store.`)
};

const ar_admintools_partnerportal_description2 = /** @type {(inputs: Admintools_Partnerportal_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشر وإدارة التطبيقات في متجر التطبيقات.`)
};

/**
* | output |
* | --- |
* | "Publish and manage apps in the App Store." |
*
* @param {Admintools_Partnerportal_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_partnerportal_description2 = /** @type {((inputs?: Admintools_Partnerportal_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Partnerportal_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_partnerportal_description2(inputs)
	if (locale === "es") return es_admintools_partnerportal_description2(inputs)
	if (locale === "fr") return fr_admintools_partnerportal_description2(inputs)
	return ar_admintools_partnerportal_description2(inputs)
});
export { admintools_partnerportal_description2 as "adminTools.partnerPortal.description" }