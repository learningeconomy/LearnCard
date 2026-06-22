/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs */

const en_developerportal_guides_embedapp_peerbadgessetup_howstep35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users pick a recipient and send the badge — you control the UX!`)
};

const es_developerportal_guides_embedapp_peerbadgessetup_howstep35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users pick a recipient and send the badge — you control the UX!`)
};

const fr_developerportal_guides_embedapp_peerbadgessetup_howstep35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users pick a recipient and send the badge — you control the UX!`)
};

const ar_developerportal_guides_embedapp_peerbadgessetup_howstep35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users pick a recipient and send the badge — you control the UX!`)
};

/**
* | output |
* | --- |
* | "Users pick a recipient and send the badge — you control the UX!" |
*
* @param {Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_peerbadgessetup_howstep35 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_peerbadgessetup_howstep35(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_peerbadgessetup_howstep35(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_peerbadgessetup_howstep35(inputs)
	return ar_developerportal_guides_embedapp_peerbadgessetup_howstep35(inputs)
});
export { developerportal_guides_embedapp_peerbadgessetup_howstep35 as "developerPortal.guides.embedApp.peerBadgesSetup.howStep3" }