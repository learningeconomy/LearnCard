/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Common_Viewfulldocs4Inputs */

const en_developerportal_integrationguide_common_viewfulldocs4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Viewfulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Full Documentation`)
};

const es_developerportal_integrationguide_common_viewfulldocs4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Viewfulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Documentación Completa`)
};

const fr_developerportal_integrationguide_common_viewfulldocs4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Viewfulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la Documentation Complète`)
};

const ar_developerportal_integrationguide_common_viewfulldocs4 = /** @type {(inputs: Developerportal_Integrationguide_Common_Viewfulldocs4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض التوثيق الكامل`)
};

/**
* | output |
* | --- |
* | "View Full Documentation" |
*
* @param {Developerportal_Integrationguide_Common_Viewfulldocs4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_common_viewfulldocs4 = /** @type {((inputs?: Developerportal_Integrationguide_Common_Viewfulldocs4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Common_Viewfulldocs4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_common_viewfulldocs4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_common_viewfulldocs4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_common_viewfulldocs4(inputs)
	return ar_developerportal_integrationguide_common_viewfulldocs4(inputs)
});
export { developerportal_integrationguide_common_viewfulldocs4 as "developerPortal.integrationGuide.common.viewFullDocs" }