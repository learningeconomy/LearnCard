/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Submissionnotice3Inputs */

const en_developerportal_components_reviewstep_submissionnotice3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Submissionnotice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`By submitting, your app will be sent for review. You'll be notified once it's approved or if changes are required.`)
};

const es_developerportal_components_reviewstep_submissionnotice3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Submissionnotice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`By submitting, your app will be sent for review. You'll be notified once it's approved or if changes are required.`)
};

const fr_developerportal_components_reviewstep_submissionnotice3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Submissionnotice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`By submitting, your app will be sent for review. You'll be notified once it's approved or if changes are required.`)
};

const ar_developerportal_components_reviewstep_submissionnotice3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Submissionnotice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`By submitting, your app will be sent for review. You'll be notified once it's approved or if changes are required.`)
};

/**
* | output |
* | --- |
* | "By submitting, your app will be sent for review. You'll be notified once it's approved or if changes are required." |
*
* @param {Developerportal_Components_Reviewstep_Submissionnotice3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_submissionnotice3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Submissionnotice3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Submissionnotice3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_submissionnotice3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_submissionnotice3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_submissionnotice3(inputs)
	return ar_developerportal_components_reviewstep_submissionnotice3(inputs)
});
export { developerportal_components_reviewstep_submissionnotice3 as "developerPortal.components.reviewStep.submissionNotice" }