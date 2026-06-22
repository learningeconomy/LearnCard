/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Copytoken3Inputs */

const en_developerportal_integrationguide_common_copytoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Copytoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy token`)
};

const es_developerportal_integrationguide_common_copytoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Copytoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar token`)
};

const fr_developerportal_integrationguide_common_copytoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Copytoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le jeton`)
};

const ar_developerportal_integrationguide_common_copytoken3 = /** @type {(inputs: Developerportal_Integrationguide_Common_Copytoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الرمز`)
};

/**
* | output |
* | --- |
* | "Copy token" |
*
* @param {Developerportal_Integrationguide_Common_Copytoken3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_copytoken3 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Copytoken3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Copytoken3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_copytoken3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_copytoken3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_copytoken3(inputs)
	return ar_developerportal_integrationguide_common_copytoken3(inputs)
});
export { developerportal_integrationguide_common_copytoken3 as "developerPortal.integrationGuide.common.copyToken" }