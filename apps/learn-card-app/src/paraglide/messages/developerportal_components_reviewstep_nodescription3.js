/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Nodescription3Inputs */

const en_developerportal_components_reviewstep_nodescription3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No description provided`)
};

const es_developerportal_components_reviewstep_nodescription3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin descripción proporcionada`)
};

const fr_developerportal_components_reviewstep_nodescription3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune description fournie`)
};

const ar_developerportal_components_reviewstep_nodescription3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تقديم وصف`)
};

/**
* | output |
* | --- |
* | "No description provided" |
*
* @param {Developerportal_Components_Reviewstep_Nodescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_nodescription3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Nodescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Nodescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_nodescription3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_nodescription3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_nodescription3(inputs)
	return ar_developerportal_components_reviewstep_nodescription3(inputs)
});
export { developerportal_components_reviewstep_nodescription3 as "developerPortal.components.reviewStep.noDescription" }