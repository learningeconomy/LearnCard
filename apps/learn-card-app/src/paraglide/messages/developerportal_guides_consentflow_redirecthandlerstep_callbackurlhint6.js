/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected here after granting consent`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los usuarios serán redirigidos aquí después de otorgar consentimiento`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les utilisateurs seront redirigés ici après avoir accordé leur consentement`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستتم إعادة توجيه المستخدمين إلى هنا بعد منح الموافقة`)
};

/**
* | output |
* | --- |
* | "Users will be redirected here after granting consent" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Callbackurlhint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_callbackurlhint6 as "developerPortal.guides.consentFlow.redirectHandlerStep.callbackUrlHint" }