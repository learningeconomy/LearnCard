/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs */

const en_developerportal_components_launchtypestep_hintdirectlink5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide a simple redirect URL for your application.`)
};

const es_developerportal_components_launchtypestep_hintdirectlink5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide a simple redirect URL for your application.`)
};

const fr_developerportal_components_launchtypestep_hintdirectlink5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide a simple redirect URL for your application.`)
};

const ar_developerportal_components_launchtypestep_hintdirectlink5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll provide a simple redirect URL for your application.`)
};

/**
* | output |
* | --- |
* | "You'll provide a simple redirect URL for your application." |
*
* @param {Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_hintdirectlink5 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Hintdirectlink5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_hintdirectlink5(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_hintdirectlink5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_hintdirectlink5(inputs)
	return ar_developerportal_components_launchtypestep_hintdirectlink5(inputs)
});
export { developerportal_components_launchtypestep_hintdirectlink5 as "developerPortal.components.launchTypeStep.hintDirectLink" }