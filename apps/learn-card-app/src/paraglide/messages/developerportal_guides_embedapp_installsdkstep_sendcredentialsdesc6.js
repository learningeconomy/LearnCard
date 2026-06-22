/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs */

const en_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue VCs to the wallet`)
};

const es_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue VCs to the wallet`)
};

const fr_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue VCs to the wallet`)
};

const ar_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue VCs to the wallet`)
};

/**
* | output |
* | --- |
* | "Issue VCs to the wallet" |
*
* @param {Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentialsdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6(inputs)
	return ar_developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6(inputs)
});
export { developerportal_guides_embedapp_installsdkstep_sendcredentialsdesc6 as "developerPortal.guides.embedApp.installSdkStep.sendCredentialsDesc" }