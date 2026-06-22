/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs */

const en_developerportal_guides_embedapp_peerbadgessetup_description4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create badge templates that users can send to each other using initiateTemplateIssue.`)
};

const es_developerportal_guides_embedapp_peerbadgessetup_description4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear badge templates that users can send to each other using initiateTemplateIssue.`)
};

const fr_developerportal_guides_embedapp_peerbadgessetup_description4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create badge templates that users can send to each other using initiateTemplateIssue.`)
};

const ar_developerportal_guides_embedapp_peerbadgessetup_description4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء badge templates that users can send to each other using initiateTemplateIssue.`)
};

/**
* | output |
* | --- |
* | "Create badge templates that users can send to each other using initiateTemplateIssue." |
*
* @param {Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_peerbadgessetup_description4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Peerbadgessetup_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_peerbadgessetup_description4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_peerbadgessetup_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_peerbadgessetup_description4(inputs)
	return ar_developerportal_guides_embedapp_peerbadgessetup_description4(inputs)
});
export { developerportal_guides_embedapp_peerbadgessetup_description4 as "developerPortal.guides.embedApp.peerBadgesSetup.description" }