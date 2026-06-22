/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs */

const en_developerportal_components_launchtypestep_hintserverheadless5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure webhook endpoints for server-to-server integration.`)
};

const es_developerportal_components_launchtypestep_hintserverheadless5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure webhook endpoints for server-to-server integration.`)
};

const fr_developerportal_components_launchtypestep_hintserverheadless5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure webhook endpoints for server-to-server integration.`)
};

const ar_developerportal_components_launchtypestep_hintserverheadless5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure webhook endpoints for server-to-server integration.`)
};

/**
* | output |
* | --- |
* | "You'll configure webhook endpoints for server-to-server integration." |
*
* @param {Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_hintserverheadless5 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Hintserverheadless5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_hintserverheadless5(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_hintserverheadless5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_hintserverheadless5(inputs)
	return ar_developerportal_components_launchtypestep_hintserverheadless5(inputs)
});
export { developerportal_components_launchtypestep_hintserverheadless5 as "developerPortal.components.launchTypeStep.hintServerHeadless" }