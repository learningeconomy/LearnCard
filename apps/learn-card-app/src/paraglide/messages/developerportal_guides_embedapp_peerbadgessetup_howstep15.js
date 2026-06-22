/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs */

const en_developerportal_guides_embedapp_peerbadgessetup_howstep15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You create badge templates below`)
};

const es_developerportal_guides_embedapp_peerbadgessetup_howstep15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You create badge templates below`)
};

const fr_developerportal_guides_embedapp_peerbadgessetup_howstep15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You create badge templates below`)
};

const ar_developerportal_guides_embedapp_peerbadgessetup_howstep15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You create badge templates below`)
};

/**
* | output |
* | --- |
* | "You create badge templates below" |
*
* @param {Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_peerbadgessetup_howstep15 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Peerbadgessetup_Howstep15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_peerbadgessetup_howstep15(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_peerbadgessetup_howstep15(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_peerbadgessetup_howstep15(inputs)
	return ar_developerportal_guides_embedapp_peerbadgessetup_howstep15(inputs)
});
export { developerportal_guides_embedapp_peerbadgessetup_howstep15 as "developerPortal.guides.embedApp.peerBadgesSetup.howStep1" }