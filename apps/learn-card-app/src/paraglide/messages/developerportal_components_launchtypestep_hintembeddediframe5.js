/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs */

const en_developerportal_components_launchtypestep_hintembeddediframe5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need to configure iframe dimensions and security settings in the next step.`)
};

const es_developerportal_components_launchtypestep_hintembeddediframe5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need to configure iframe dimensions and security settings in the next step.`)
};

const fr_developerportal_components_launchtypestep_hintembeddediframe5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need to configure iframe dimensions and security settings in the next step.`)
};

const ar_developerportal_components_launchtypestep_hintembeddediframe5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need to configure iframe dimensions and security settings in the next step.`)
};

/**
* | output |
* | --- |
* | "You'll need to configure iframe dimensions and security settings in the next step." |
*
* @param {Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_hintembeddediframe5 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Hintembeddediframe5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_hintembeddediframe5(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_hintembeddediframe5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_hintembeddediframe5(inputs)
	return ar_developerportal_components_launchtypestep_hintembeddediframe5(inputs)
});
export { developerportal_components_launchtypestep_hintembeddediframe5 as "developerPortal.components.launchTypeStep.hintEmbeddedIframe" }