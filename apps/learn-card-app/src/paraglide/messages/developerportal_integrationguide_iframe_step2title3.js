/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step2title3Inputs */

const en_developerportal_integrationguide_iframe_step2title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install the SDK`)
};

const es_developerportal_integrationguide_iframe_step2title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala el SDK`)
};

const fr_developerportal_integrationguide_iframe_step2title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installer le SDK`)
};

const ar_developerportal_integrationguide_iframe_step2title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تثبيت SDK`)
};

/**
* | output |
* | --- |
* | "Install the SDK" |
*
* @param {Developerportal_Integrationguide_Iframe_Step2title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step2title3 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step2title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step2title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step2title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step2title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step2title3(inputs)
	return ar_developerportal_integrationguide_iframe_step2title3(inputs)
});
export { developerportal_integrationguide_iframe_step2title3 as "developerPortal.integrationGuide.iframe.step2Title" }