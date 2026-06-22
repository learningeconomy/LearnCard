/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step3title3Inputs */

const en_developerportal_integrationguide_iframe_step3title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialize Partner Connect`)
};

const es_developerportal_integrationguide_iframe_step3title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicializa Partner Connect`)
};

const fr_developerportal_integrationguide_iframe_step3title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialiser Partner Connect`)
};

const ar_developerportal_integrationguide_iframe_step3title3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تهيئة Partner Connect`)
};

/**
* | output |
* | --- |
* | "Initialize Partner Connect" |
*
* @param {Developerportal_Integrationguide_Iframe_Step3title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step3title3 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step3title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step3title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step3title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step3title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step3title3(inputs)
	return ar_developerportal_integrationguide_iframe_step3title3(inputs)
});
export { developerportal_integrationguide_iframe_step3title3 as "developerPortal.integrationGuide.iframe.step3Title" }