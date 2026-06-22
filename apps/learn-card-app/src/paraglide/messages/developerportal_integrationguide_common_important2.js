/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Important2Inputs */

const en_developerportal_integrationguide_common_important2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Important2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important`)
};

const es_developerportal_integrationguide_common_important2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Important2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importante`)
};

const fr_developerportal_integrationguide_common_important2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Important2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important`)
};

const ar_developerportal_integrationguide_common_important2 = /** @type {(inputs: Developerportal_Integrationguide_Common_Important2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهم`)
};

/**
* | output |
* | --- |
* | "Important" |
*
* @param {Developerportal_Integrationguide_Common_Important2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_important2 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Important2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Important2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_important2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_important2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_important2(inputs)
	return ar_developerportal_integrationguide_common_important2(inputs)
});
export { developerportal_integrationguide_common_important2 as "developerPortal.integrationGuide.common.important" }