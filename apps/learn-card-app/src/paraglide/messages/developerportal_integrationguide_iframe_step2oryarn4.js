/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs */

const en_developerportal_integrationguide_iframe_step2oryarn4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or use yarn:`)
};

const es_developerportal_integrationguide_iframe_step2oryarn4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O usa yarn:`)
};

const fr_developerportal_integrationguide_iframe_step2oryarn4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ou utilisez yarn :`)
};

const ar_developerportal_integrationguide_iframe_step2oryarn4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو استخدم yarn:`)
};

/**
* | output |
* | --- |
* | "Or use yarn:" |
*
* @param {Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step2oryarn4 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step2oryarn4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step2oryarn4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step2oryarn4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step2oryarn4(inputs)
	return ar_developerportal_integrationguide_iframe_step2oryarn4(inputs)
});
export { developerportal_integrationguide_iframe_step2oryarn4 as "developerPortal.integrationGuide.iframe.step2OrYarn" }