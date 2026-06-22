/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs */

const en_developerportal_guides_embedapp_peerbadgessetup_howstep25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In your app, call initiateTemplateIssue with a template URI`)
};

const es_developerportal_guides_embedapp_peerbadgessetup_howstep25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In your app, call initiateTemplateIssue with a template URI`)
};

const fr_developerportal_guides_embedapp_peerbadgessetup_howstep25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In your app, call initiateTemplateIssue with a template URI`)
};

const ar_developerportal_guides_embedapp_peerbadgessetup_howstep25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In your app, call initiateTemplateIssue with a template URI`)
};

/**
* | output |
* | --- |
* | "In your app, call initiateTemplateIssue with a template URI" |
*
* @param {Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_peerbadgessetup_howstep25 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_peerbadgessetup_howstep25(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_peerbadgessetup_howstep25(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_peerbadgessetup_howstep25(inputs)
	return ar_developerportal_guides_embedapp_peerbadgessetup_howstep25(inputs)
});
export { developerportal_guides_embedapp_peerbadgessetup_howstep25 as "developerPortal.guides.embedApp.peerBadgesSetup.howStep2" }