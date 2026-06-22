/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Worklife_Notadequate3Inputs */

const en_aipathways_worklife_notadequate3 = /** @type {(inputs: Aipathways_Worklife_Notadequate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Adequate`)
};

const es_aipathways_worklife_notadequate3 = /** @type {(inputs: Aipathways_Worklife_Notadequate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Es Genial`)
};

const fr_aipathways_worklife_notadequate3 = /** @type {(inputs: Aipathways_Worklife_Notadequate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce n'est pas terrible`)
};

const ar_aipathways_worklife_notadequate3 = /** @type {(inputs: Aipathways_Worklife_Notadequate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليس رائعًا`)
};

/**
* | output |
* | --- |
* | "Not Adequate" |
*
* @param {Aipathways_Worklife_Notadequate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_worklife_notadequate3 = /** @type {((inputs?: Aipathways_Worklife_Notadequate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Worklife_Notadequate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_worklife_notadequate3(inputs)
	if (locale === "es") return es_aipathways_worklife_notadequate3(inputs)
	if (locale === "fr") return fr_aipathways_worklife_notadequate3(inputs)
	return ar_aipathways_worklife_notadequate3(inputs)
});
export { aipathways_worklife_notadequate3 as "aiPathways.workLife.notAdequate" }